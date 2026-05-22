"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import { parseMovementDateInput } from "@/lib/admin/data/inventory-queries";
import { dec } from "@/lib/admin/inventory-serialize";
import {
  inventoryCategoryIdSchema,
  inventoryCategorySchema,
  inventoryCategoryUpdateSchema,
  inventoryIdSchema,
  inventoryItemCoreSchema,
  inventoryItemUpdateSchema,
  inventoryMovementSchema,
  parseOptionalDecimal,
  parseRequiredDecimal,
} from "@/lib/admin/validation/inventory-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

function friendlyErr(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return "Duplicate SKU or slug. Please use a unique value.";
    return "Something went wrong. Please try again.";
  }
  if (e instanceof Error && e.message) return e.message;
  return "Something went wrong. Please try again.";
}

function revalidateInventoryPaths(itemId?: string) {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/movements");
  revalidatePath("/admin/inventory/categories");
  revalidatePath("/admin/production");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reports/export");
  if (itemId) revalidatePath(`/admin/inventory/${itemId}`);
}

function itemDataFromParsed(parsed: ReturnType<typeof inventoryItemCoreSchema.parse>) {
  return {
    type: parsed.type,
    categoryId: parsed.categoryId?.trim() ? parsed.categoryId.trim() : null,
    nameEn: parsed.nameEn.trim(),
    nameAr: parsed.nameAr?.trim() ? parsed.nameAr.trim() : null,
    sku: parsed.sku?.trim() ? parsed.sku.trim() : null,
    unit: parsed.unit,
    currentQuantity: new Prisma.Decimal(parseRequiredDecimal(parsed.currentQuantity).toFixed(3)),
    lowStockThreshold:
      parseOptionalDecimal(parsed.lowStockThreshold) != null
        ? new Prisma.Decimal(parseOptionalDecimal(parsed.lowStockThreshold)!.toFixed(3))
        : null,
    reorderQuantity:
      parseOptionalDecimal(parsed.reorderQuantity) != null
        ? new Prisma.Decimal(parseOptionalDecimal(parsed.reorderQuantity)!.toFixed(3))
        : null,
    averageUnitCostOmr:
      parseOptionalDecimal(parsed.averageUnitCostOmr) != null
        ? new Prisma.Decimal(parseOptionalDecimal(parsed.averageUnitCostOmr)!.toFixed(3))
        : null,
    supplierName: parsed.supplierName?.trim() ? parsed.supplierName.trim() : null,
    supplierContact: parsed.supplierContact?.trim() ? parsed.supplierContact.trim() : null,
    storageLocation: parsed.storageLocation?.trim() ? parsed.storageLocation.trim() : null,
    notes: parsed.notes?.trim() ? parsed.notes.trim() : null,
    isActive: parsed.isActive ?? true,
  };
}

async function validateCategoryId(categoryId: string | null) {
  if (!categoryId) return;
  const cat = await prisma.inventoryCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!cat) throw new Error("Selected category was not found.");
}

type MovementApplyInput = {
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCostOmr?: number | null;
  reason?: string | null;
  movementDate?: Date;
  targetQuantity?: number | null;
};

async function applyInventoryMovement(tx: Prisma.TransactionClient, input: MovementApplyInput) {
  const item = await tx.inventoryItem.findUnique({ where: { id: input.itemId } });
  if (!item) throw new Error("Inventory item not found.");

  const current = dec(item.currentQuantity);
  let delta = 0;
  let recordedQty = Math.abs(input.quantity);

  switch (input.type) {
    case InventoryMovementType.STOCK_IN:
      if (input.quantity <= 0) throw new Error("Stock in quantity must be greater than zero.");
      delta = input.quantity;
      recordedQty = input.quantity;
      break;
    case InventoryMovementType.STOCK_OUT:
    case InventoryMovementType.WASTE:
      if (input.quantity <= 0) throw new Error("Quantity must be greater than zero.");
      if (current < input.quantity) {
        throw new Error(`Insufficient stock. Available: ${current.toFixed(3)} ${item.unit}.`);
      }
      delta = -input.quantity;
      recordedQty = input.quantity;
      break;
    case InventoryMovementType.ADJUSTMENT:
      if (input.quantity === 0) throw new Error("Adjustment quantity cannot be zero.");
      delta = input.quantity;
      recordedQty = Math.abs(input.quantity);
      if (current + delta < 0) {
        throw new Error(`Adjustment would make stock negative. Available: ${current.toFixed(3)}.`);
      }
      break;
    case InventoryMovementType.MANUAL_CORRECTION: {
      if (input.targetQuantity == null || input.targetQuantity < 0) {
        throw new Error("Target quantity is required for manual correction.");
      }
      if (!input.reason?.trim()) throw new Error("Reason is required for manual correction.");
      delta = input.targetQuantity - current;
      recordedQty = Math.abs(delta);
      break;
    }
    case InventoryMovementType.RESERVED:
    case InventoryMovementType.RELEASED:
      if (input.quantity <= 0) throw new Error("Quantity must be greater than zero.");
      delta = input.type === InventoryMovementType.RESERVED ? -input.quantity : input.quantity;
      recordedQty = input.quantity;
      if (current + delta < 0) {
        throw new Error(`Insufficient stock. Available: ${current.toFixed(3)}.`);
      }
      break;
    default:
      throw new Error("Unsupported movement type.");
  }

  const newQty = input.type === InventoryMovementType.MANUAL_CORRECTION
    ? input.targetQuantity!
    : current + delta;

  if (newQty < 0) throw new Error("Stock cannot go negative.");

  const unitCost = input.unitCostOmr ?? null;
  const totalCost =
    unitCost != null && recordedQty > 0
      ? new Prisma.Decimal((unitCost * recordedQty).toFixed(3))
      : null;

  let newAverage = item.averageUnitCostOmr;
  if (input.type === InventoryMovementType.STOCK_IN && unitCost != null && unitCost > 0) {
    const oldAvg = item.averageUnitCostOmr != null ? dec(item.averageUnitCostOmr) : 0;
    const inQty = input.quantity;
    const combined = current + inQty;
    const weighted =
      combined > 0 ? (current * oldAvg + inQty * unitCost) / combined : unitCost;
    newAverage = new Prisma.Decimal(weighted.toFixed(3));
  }

  await tx.inventoryMovement.create({
    data: {
      itemId: input.itemId,
      type: input.type,
      quantity: new Prisma.Decimal(recordedQty.toFixed(3)),
      unit: item.unit,
      unitCostOmr: unitCost != null ? new Prisma.Decimal(unitCost.toFixed(3)) : null,
      totalCostOmr: totalCost,
      reason: input.reason?.trim() ? input.reason.trim() : null,
      movementDate: input.movementDate ?? new Date(),
    },
  });

  await tx.inventoryItem.update({
    where: { id: input.itemId },
    data: {
      currentQuantity: new Prisma.Decimal(newQty.toFixed(3)),
      averageUnitCostOmr: newAverage,
    },
  });
}

function parseItemForm(formData: FormData) {
  return {
    type: String(formData.get("type") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    unit: String(formData.get("unit") ?? ""),
    currentQuantity: String(formData.get("currentQuantity") ?? "0"),
    lowStockThreshold: String(formData.get("lowStockThreshold") ?? ""),
    reorderQuantity: String(formData.get("reorderQuantity") ?? ""),
    averageUnitCostOmr: String(formData.get("averageUnitCostOmr") ?? ""),
    supplierName: String(formData.get("supplierName") ?? ""),
    supplierContact: String(formData.get("supplierContact") ?? ""),
    storageLocation: String(formData.get("storageLocation") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  };
}

export async function createInventoryItemFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryItemCoreSchema.safeParse(parseItemForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  try {
    await validateCategoryId(parsed.data.categoryId?.trim() ? parsed.data.categoryId.trim() : null);
    const qty = parseRequiredDecimal(parsed.data.currentQuantity);

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          ...itemDataFromParsed({ ...parsed.data, currentQuantity: "0" }),
          currentQuantity: new Prisma.Decimal("0"),
        },
      });

      if (qty > 0) {
        await applyInventoryMovement(tx, {
          itemId: created.id,
          type: InventoryMovementType.STOCK_IN,
          quantity: qty,
          unitCostOmr: parseOptionalDecimal(parsed.data.averageUnitCostOmr),
          reason: "Initial stock",
        });
      } else {
        await tx.inventoryItem.update({
          where: { id: created.id },
          data: itemDataFromParsed(parsed.data),
        });
      }

      return created;
    });

    revalidateInventoryPaths(item.id);
    redirect(`/admin/inventory/${item.id}`);
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    return { error: friendlyErr(e) };
  }
}

export async function updateInventoryItemFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryItemUpdateSchema.safeParse({
    ...parseItemForm(formData),
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  try {
    await validateCategoryId(parsed.data.categoryId?.trim() ? parsed.data.categoryId.trim() : null);
    const existing = await prisma.inventoryItem.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, currentQuantity: true },
    });
    if (!existing) return { error: "Item not found." };

    const data = itemDataFromParsed(parsed.data);
    await prisma.inventoryItem.update({
      where: { id: parsed.data.id },
      data: {
        ...data,
        currentQuantity: existing.currentQuantity,
      },
    });

    revalidateInventoryPaths(parsed.data.id);
    return { success: "Item saved." };
  } catch (e) {
    return { error: friendlyErr(e) };
  }
}

export async function deactivateInventoryItemFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  await prisma.inventoryItem.update({
    where: { id: parsed.data.id },
    data: { isActive: false },
  });
  revalidateInventoryPaths(parsed.data.id);
  return { success: "Item deactivated." };
}

export async function activateInventoryItemFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  await prisma.inventoryItem.update({
    where: { id: parsed.data.id },
    data: { isActive: true },
  });
  revalidateInventoryPaths(parsed.data.id);
  return { success: "Item activated." };
}

export async function deleteInventoryItemFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  const count = await prisma.inventoryMovement.count({ where: { itemId: parsed.data.id } });
  if (count > 0) {
    return {
      error:
        "This item has stock history and cannot be deleted. Deactivate it instead.",
    };
  }

  await prisma.inventoryItem.delete({ where: { id: parsed.data.id } });
  revalidateInventoryPaths();
  redirect("/admin/inventory");
}

export async function createInventoryMovementFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryMovementSchema.safeParse({
    itemId: String(formData.get("itemId") ?? ""),
    type: String(formData.get("type") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unitCostOmr: String(formData.get("unitCostOmr") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    movementDate: String(formData.get("movementDate") ?? ""),
    targetQuantity: String(formData.get("targetQuantity") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  try {
    const qtyRaw = parsed.data.quantity.trim();
    let quantity = Number(qtyRaw);
    const targetQuantity = parseOptionalDecimal(parsed.data.targetQuantity ?? undefined);

    if (parsed.data.type === InventoryMovementType.ADJUSTMENT) {
      quantity = Number(qtyRaw);
      if (!Number.isFinite(quantity) || quantity === 0) {
        return { error: "Adjustment quantity must be a non-zero number (use + or -)." };
      }
    } else if (parsed.data.type === InventoryMovementType.MANUAL_CORRECTION) {
      quantity = 0;
    } else {
      quantity = parseRequiredDecimal(qtyRaw);
    }

    if (
      parsed.data.type === InventoryMovementType.MANUAL_CORRECTION &&
      !parsed.data.reason?.trim()
    ) {
      return { error: "Reason is required for manual correction." };
    }

    await prisma.$transaction(async (tx) => {
      await applyInventoryMovement(tx, {
        itemId: parsed.data.itemId,
        type: parsed.data.type,
        quantity,
        unitCostOmr: parseOptionalDecimal(parsed.data.unitCostOmr ?? undefined),
        reason: parsed.data.reason,
        movementDate: parseMovementDateInput(parsed.data.movementDate),
        targetQuantity,
      });
    });

    revalidateInventoryPaths(parsed.data.itemId);
    return { success: "Stock movement recorded." };
  } catch (e) {
    return { error: friendlyErr(e) };
  }
}

export async function createInventoryCategoryFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryCategorySchema.safeParse({
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    slug: String(formData.get("slug") ?? "").toLowerCase(),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  try {
    await prisma.inventoryCategory.create({
      data: {
        nameEn: parsed.data.nameEn.trim(),
        nameAr: parsed.data.nameAr?.trim() ? parsed.data.nameAr.trim() : null,
        slug: parsed.data.slug.trim(),
        type: parsed.data.type,
        description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });
    revalidateInventoryPaths();
    return { success: "Category created." };
  } catch (e) {
    return { error: friendlyErr(e) };
  }
}

export async function updateInventoryCategoryFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryCategoryUpdateSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    slug: String(formData.get("slug") ?? "").toLowerCase(),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(" ") };
  }

  try {
    await prisma.inventoryCategory.update({
      where: { id: parsed.data.id },
      data: {
        nameEn: parsed.data.nameEn.trim(),
        nameAr: parsed.data.nameAr?.trim() ? parsed.data.nameAr.trim() : null,
        slug: parsed.data.slug.trim(),
        type: parsed.data.type,
        description: parsed.data.description?.trim() ? parsed.data.description.trim() : null,
        sortOrder: parsed.data.sortOrder ?? 0,
        isActive: parsed.data.isActive ?? true,
      },
    });
    revalidateInventoryPaths();
    return { success: "Category saved." };
  } catch (e) {
    return { error: friendlyErr(e) };
  }
}

export async function deactivateInventoryCategoryFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryCategoryIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  await prisma.inventoryCategory.update({
    where: { id: parsed.data.id },
    data: { isActive: false },
  });
  revalidateInventoryPaths();
  return { success: "Category deactivated." };
}

export async function deleteInventoryCategoryFormAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();
  const parsed = inventoryCategoryIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(" ") };

  const count = await prisma.inventoryItem.count({ where: { categoryId: parsed.data.id } });
  if (count > 0) {
    return { error: "Category has inventory items. Deactivate it instead of deleting." };
  }

  await prisma.inventoryCategory.delete({ where: { id: parsed.data.id } });
  revalidateInventoryPaths();
  return { success: "Category deleted." };
}
