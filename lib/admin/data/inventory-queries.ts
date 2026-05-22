import "server-only";

import {
  InventoryItemType,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";

import {
  dec,
  estimatedItemValue,
  isLowStock,
  type InventoryCategoryAdminRecord,
  type InventoryDashboardSummary,
  type InventoryItemAdminRecord,
  type InventoryMovementAdminRecord,
} from "@/lib/admin/inventory-serialize";
import { prisma } from "@/lib/db/prisma";

export type InventoryItemListFilter = {
  q?: string;
  type?: InventoryItemType;
  categoryId?: string;
  active?: "all" | "active" | "inactive";
  lowStockOnly?: boolean;
  sort?: "name" | "newest" | "low_stock" | "quantity" | "value";
};

export type InventoryMovementListFilter = {
  itemId?: string;
  type?: InventoryMovementType;
  from?: Date;
  to?: Date;
  limit?: number;
};

function mapItemRow(
  row: {
    id: string;
    categoryId: string | null;
    type: InventoryItemType;
    nameEn: string;
    nameAr: string | null;
    sku: string | null;
    unit: InventoryItemAdminRecord["unit"];
    currentQuantity: { toString(): string };
    lowStockThreshold: { toString(): string } | null;
    reorderQuantity: { toString(): string } | null;
    averageUnitCostOmr: { toString(): string } | null;
    supplierName: string | null;
    supplierContact: string | null;
    storageLocation: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    category: { nameEn: string } | null;
    _count?: { movements: number };
  },
): InventoryItemAdminRecord {
  const currentQuantity = dec(row.currentQuantity);
  const lowStockThreshold = row.lowStockThreshold != null ? dec(row.lowStockThreshold) : null;
  const averageUnitCostOmr = row.averageUnitCostOmr != null ? dec(row.averageUnitCostOmr) : null;

  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName: row.category?.nameEn ?? null,
    type: row.type,
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    sku: row.sku,
    unit: row.unit,
    currentQuantity,
    lowStockThreshold,
    reorderQuantity: row.reorderQuantity != null ? dec(row.reorderQuantity) : null,
    averageUnitCostOmr,
    supplierName: row.supplierName,
    supplierContact: row.supplierContact,
    storageLocation: row.storageLocation,
    notes: row.notes,
    isActive: row.isActive,
    isLowStock: isLowStock(currentQuantity, lowStockThreshold),
    estimatedValueOmr: estimatedItemValue(currentQuantity, averageUnitCostOmr),
    movementCount: row._count?.movements ?? 0,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  };
}

export async function getInventoryItemsForAdmin(filters: InventoryItemListFilter = {}) {
  const where: Prisma.InventoryItemWhereInput = {};

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameAr: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { supplierName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  if (filters.active === "active") where.isActive = true;
  if (filters.active === "inactive") where.isActive = false;

  const rows = await prisma.inventoryItem.findMany({
    where,
    include: {
      category: { select: { nameEn: true } },
      _count: { select: { movements: true } },
    },
  });

  let mapped = rows.map(mapItemRow);

  if (filters.lowStockOnly) {
    mapped = mapped.filter((r) => r.isLowStock);
  }

  const sort = filters.sort ?? "name";
  mapped.sort((a, b) => {
    switch (sort) {
      case "newest":
        return Date.parse(b.createdAtIso) - Date.parse(a.createdAtIso);
      case "quantity":
        return b.currentQuantity - a.currentQuantity || a.nameEn.localeCompare(b.nameEn);
      case "value":
        return b.estimatedValueOmr - a.estimatedValueOmr || a.nameEn.localeCompare(b.nameEn);
      case "low_stock":
        if (a.isLowStock !== b.isLowStock) return a.isLowStock ? -1 : 1;
        return a.currentQuantity - b.currentQuantity;
      case "name":
      default:
        return a.nameEn.localeCompare(b.nameEn);
    }
  });

  return mapped;
}

export async function getInventoryItemForAdmin(id: string): Promise<InventoryItemAdminRecord | null> {
  const row = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      category: { select: { nameEn: true } },
      _count: { select: { movements: true } },
    },
  });
  if (!row) return null;
  return mapItemRow(row);
}

export async function getInventoryCategoriesForAdmin(filters?: {
  type?: InventoryItemType;
  active?: "all" | "active" | "inactive";
}) {
  const where: Prisma.InventoryCategoryWhereInput = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.active === "active") where.isActive = true;
  if (filters?.active === "inactive") where.isActive = false;

  const rows = await prisma.inventoryCategory.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: { _count: { select: { items: true } } },
  });

  return rows.map(
    (r): InventoryCategoryAdminRecord => ({
      id: r.id,
      nameEn: r.nameEn,
      nameAr: r.nameAr,
      slug: r.slug,
      type: r.type,
      description: r.description,
      sortOrder: r.sortOrder,
      isActive: r.isActive,
      itemCount: r._count.items,
      createdAtIso: r.createdAt.toISOString(),
      updatedAtIso: r.updatedAt.toISOString(),
    }),
  );
}

export async function getInventoryMovementsForAdmin(
  filters: InventoryMovementListFilter = {},
): Promise<InventoryMovementAdminRecord[]> {
  const where: Prisma.InventoryMovementWhereInput = {};
  if (filters.itemId) where.itemId = filters.itemId;
  if (filters.type) where.type = filters.type;
  if (filters.from || filters.to) {
    where.movementDate = {};
    if (filters.from) where.movementDate.gte = filters.from;
    if (filters.to) where.movementDate.lte = filters.to;
  }

  const rows = await prisma.inventoryMovement.findMany({
    where,
    orderBy: { movementDate: "desc" },
    take: filters.limit ?? 200,
    include: { item: { select: { nameEn: true } } },
  });

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    itemName: r.item.nameEn,
    type: r.type,
    quantity: dec(r.quantity),
    unit: r.unit,
    unitCostOmr: r.unitCostOmr != null ? dec(r.unitCostOmr) : null,
    totalCostOmr: r.totalCostOmr != null ? dec(r.totalCostOmr) : null,
    reason: r.reason,
    referenceType: r.referenceType,
    referenceId: r.referenceId,
    movementDateIso: r.movementDate.toISOString(),
    createdAtIso: r.createdAt.toISOString(),
  }));
}

export async function getInventoryDashboardSummary(): Promise<InventoryDashboardSummary> {
  const items = await getInventoryItemsForAdmin({ active: "active" });
  let lowStockCount = 0;
  let packagingLowStockCount = 0;
  let ingredientCount = 0;
  let packagingCount = 0;
  let totalEstimatedValueOmr = 0;

  for (const item of items) {
    totalEstimatedValueOmr += item.estimatedValueOmr;
    if (item.type === InventoryItemType.INGREDIENT) ingredientCount += 1;
    if (item.type === InventoryItemType.PACKAGING) packagingCount += 1;
    if (item.isLowStock) {
      lowStockCount += 1;
      if (item.type === InventoryItemType.PACKAGING) packagingLowStockCount += 1;
    }
  }

  return {
    totalActiveItems: items.length,
    lowStockCount,
    packagingLowStockCount,
    ingredientCount,
    packagingCount,
    totalEstimatedValueOmr: Math.round(totalEstimatedValueOmr * 1000) / 1000,
  };
}

export async function getLowStockItems(limit = 12): Promise<InventoryItemAdminRecord[]> {
  const items = await getInventoryItemsForAdmin({
    active: "active",
    lowStockOnly: true,
    sort: "low_stock",
  });
  return items.slice(0, limit);
}

export async function getInventoryValueSummary() {
  const summary = await getInventoryDashboardSummary();
  return {
    totalEstimatedValueOmr: summary.totalEstimatedValueOmr,
    lowStockCount: summary.lowStockCount,
  };
}

export async function exportInventoryRows(): Promise<unknown[][]> {
  const items = await getInventoryItemsForAdmin({ active: "all", sort: "name" });
  return items.map((r) => [
    r.nameEn,
    r.type,
    r.categoryName ?? "",
    r.currentQuantity,
    r.unit,
    r.lowStockThreshold ?? "",
    r.averageUnitCostOmr ?? "",
    r.estimatedValueOmr,
    r.supplierName ?? "",
    r.isActive ? "yes" : "no",
  ]);
}

export async function exportInventoryMovementRows(from?: Date, to?: Date): Promise<unknown[][]> {
  const movements = await getInventoryMovementsForAdmin({ from, to, limit: 5000 });
  return movements.map((m) => [
    m.itemName,
    m.type,
    m.quantity,
    m.unit,
    m.totalCostOmr ?? "",
    m.reason ?? "",
    m.movementDateIso.slice(0, 19),
  ]);
}

export function parseMovementDateInput(value: string | undefined): Date {
  if (value?.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function parseYmdUtcStart(s: string | undefined): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 0, 0, 0, 0));
}

export function parseYmdUtcEnd(s: string | undefined): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 23, 59, 59, 999));
}
