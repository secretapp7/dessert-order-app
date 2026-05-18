"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, ProductStatus } from "@prisma/client";
import type { z } from "zod";

import { requireAdmin } from "@/lib/auth/admin-session";
import {
  imageInputSchema,
  productCoreSchema,
  productSizeInputSchema,
} from "@/lib/admin/validation/catalog";
import { prisma } from "@/lib/db/prisma";

import type { AdminFormState } from "@/lib/admin/admin-form-state";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateProductResult =
  | { ok: true; productId: string }
  | { ok: false; error: string };

export type ProductFormState = AdminFormState;

function friendlyPrismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "That slug is already in use.";
  }
  return "Something went wrong. Please try again.";
}

function decimalsForSize(data: z.infer<typeof productSizeInputSchema>) {
  return {
    priceOmr: new Prisma.Decimal(String(data.priceOmr)),
    ingredientCostOmr: new Prisma.Decimal(String(data.ingredientCostOmr)),
    packagingCostOmr: new Prisma.Decimal(String(data.packagingCostOmr)),
    laborCostOmr: new Prisma.Decimal(String(data.laborCostOmr)),
  };
}

function revalidateProductPaths(productId: string) {
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin");
}

export async function createProductAction(formData: FormData): Promise<CreateProductResult> {
  await requireAdmin();

  const coreParsed = productCoreSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionAr: String(formData.get("descriptionAr") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
    badgeEn: String(formData.get("badgeEn") ?? ""),
    badgeAr: String(formData.get("badgeAr") ?? ""),
    featured: formData.has("featured"),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  if (!coreParsed.success) {
    const msg =
      coreParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ||
      "Invalid product.";
    return { ok: false, error: msg };
  }

  const sizeParsed = productSizeInputSchema.safeParse({
    labelEn: String(formData.get("size_labelEn") ?? ""),
    labelAr: String(formData.get("size_labelAr") ?? ""),
    servesEn: String(formData.get("size_servesEn") ?? ""),
    servesAr: String(formData.get("size_servesAr") ?? ""),
    priceOmr: Number(formData.get("size_priceOmr") ?? ""),
    ingredientCostOmr: Number(formData.get("size_ingredientCostOmr") ?? 0),
    packagingCostOmr: Number(formData.get("size_packagingCostOmr") ?? 0),
    laborCostOmr: Number(formData.get("size_laborCostOmr") ?? 0),
    sortOrder: Number(formData.get("size_sortOrder") ?? 0),
    isActive: formData.has("size_isActive"),
  });
  if (!sizeParsed.success) {
    const msg =
      sizeParsed.error.issues.map((i) => `First size: ${i.message}`).join("; ") ||
      "Invalid first size.";
    return { ok: false, error: msg };
  }

  const d = decimalsForSize(sizeParsed.data);

  try {
    const product = await prisma.product.create({
      data: {
        slug: coreParsed.data.slug,
        nameEn: coreParsed.data.nameEn.trim(),
        nameAr: coreParsed.data.nameAr.trim(),
        descriptionEn: coreParsed.data.descriptionEn.trim(),
        descriptionAr: coreParsed.data.descriptionAr.trim(),
        categoryId: coreParsed.data.categoryId ?? null,
        status: coreParsed.data.status,
        badgeEn: coreParsed.data.badgeEn,
        badgeAr: coreParsed.data.badgeAr,
        featured: coreParsed.data.featured,
        sortOrder: coreParsed.data.sortOrder,
        sizes: {
          create: {
            labelEn: sizeParsed.data.labelEn.trim(),
            labelAr: sizeParsed.data.labelAr.trim(),
            servesEn: sizeParsed.data.servesEn.trim(),
            servesAr: sizeParsed.data.servesAr.trim(),
            ...d,
            sortOrder: sizeParsed.data.sortOrder,
            isActive: sizeParsed.data.isActive,
          },
        },
      },
    });
    revalidateProductPaths(product.id);
    revalidatePath("/admin/categories");
    return { ok: true, productId: product.id };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function updateProductAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing product." };

  const coreParsed = productCoreSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionAr: String(formData.get("descriptionAr") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? "ACTIVE"),
    badgeEn: String(formData.get("badgeEn") ?? ""),
    badgeAr: String(formData.get("badgeAr") ?? ""),
    featured: formData.has("featured"),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  if (!coreParsed.success) {
    const msg =
      coreParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") ||
      "Invalid product.";
    return { ok: false, error: msg };
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        slug: coreParsed.data.slug,
        nameEn: coreParsed.data.nameEn.trim(),
        nameAr: coreParsed.data.nameAr.trim(),
        descriptionEn: coreParsed.data.descriptionEn.trim(),
        descriptionAr: coreParsed.data.descriptionAr.trim(),
        categoryId: coreParsed.data.categoryId ?? null,
        status: coreParsed.data.status,
        badgeEn: coreParsed.data.badgeEn,
        badgeAr: coreParsed.data.badgeAr,
        featured: coreParsed.data.featured,
        sortOrder: coreParsed.data.sortOrder,
      },
    });
    revalidateProductPaths(id);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function createProductSizeAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { ok: false, error: "Missing product." };

  const sizeParsed = productSizeInputSchema.safeParse({
    labelEn: String(formData.get("labelEn") ?? ""),
    labelAr: String(formData.get("labelAr") ?? ""),
    servesEn: String(formData.get("servesEn") ?? ""),
    servesAr: String(formData.get("servesAr") ?? ""),
    priceOmr: Number(formData.get("priceOmr") ?? ""),
    ingredientCostOmr: Number(formData.get("ingredientCostOmr") ?? 0),
    packagingCostOmr: Number(formData.get("packagingCostOmr") ?? 0),
    laborCostOmr: Number(formData.get("laborCostOmr") ?? 0),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.has("isActive"),
  });
  if (!sizeParsed.success) {
    return { ok: false, error: sizeParsed.error.issues.map((i) => i.message).join(" ") };
  }

  const d = decimalsForSize(sizeParsed.data);
  try {
    await prisma.productSize.create({
      data: {
        productId,
        labelEn: sizeParsed.data.labelEn.trim(),
        labelAr: sizeParsed.data.labelAr.trim(),
        servesEn: sizeParsed.data.servesEn.trim(),
        servesAr: sizeParsed.data.servesAr.trim(),
        ...d,
        sortOrder: sizeParsed.data.sortOrder,
        isActive: sizeParsed.data.isActive,
      },
    });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function updateProductSizeAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { ok: false, error: "Missing size." };

  const sizeParsed = productSizeInputSchema.safeParse({
    labelEn: String(formData.get("labelEn") ?? ""),
    labelAr: String(formData.get("labelAr") ?? ""),
    servesEn: String(formData.get("servesEn") ?? ""),
    servesAr: String(formData.get("servesAr") ?? ""),
    priceOmr: Number(formData.get("priceOmr") ?? ""),
    ingredientCostOmr: Number(formData.get("ingredientCostOmr") ?? 0),
    packagingCostOmr: Number(formData.get("packagingCostOmr") ?? 0),
    laborCostOmr: Number(formData.get("laborCostOmr") ?? 0),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.has("isActive"),
  });
  if (!sizeParsed.success) {
    return { ok: false, error: sizeParsed.error.issues.map((i) => i.message).join(" ") };
  }

  const d = decimalsForSize(sizeParsed.data);
  try {
    await prisma.productSize.update({
      where: { id },
      data: {
        labelEn: sizeParsed.data.labelEn.trim(),
        labelAr: sizeParsed.data.labelAr.trim(),
        servesEn: sizeParsed.data.servesEn.trim(),
        servesAr: sizeParsed.data.servesAr.trim(),
        ...d,
        sortOrder: sizeParsed.data.sortOrder,
        isActive: sizeParsed.data.isActive,
      },
    });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deactivateProductSizeAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { ok: false, error: "Missing size." };
  try {
    await prisma.productSize.update({
      where: { id },
      data: { isActive: false },
    });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deleteProductSizeAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { ok: false, error: "Missing size." };
  if (!formData.has("confirmDelete")) {
    return {
      ok: false,
      error: "Check the confirmation box before deleting permanently.",
    };
  }
  try {
    const usage = await prisma.orderItem.count({ where: { productSizeId: id } });
    if (usage > 0) {
      return {
        ok: false,
        error: "This size has order history and cannot be deleted. Deactivate it instead.",
      };
    }
    await prisma.productSize.delete({ where: { id } });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function hideProductAction(formData: FormData): Promise<ActionResult> {
  return setProductLifecycleStatus(formData, ProductStatus.HIDDEN);
}

export async function soldOutProductAction(formData: FormData): Promise<ActionResult> {
  return setProductLifecycleStatus(formData, ProductStatus.SOLD_OUT);
}

export async function activateProductAction(formData: FormData): Promise<ActionResult> {
  return setProductLifecycleStatus(formData, ProductStatus.ACTIVE);
}

async function setProductLifecycleStatus(
  formData: FormData,
  status: ProductStatus,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing product." };
  try {
    const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { ok: false, error: "Product not found." };
    await prisma.product.update({ where: { id }, data: { status } });
    revalidateProductPaths(id);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing product." };
  const confirmSlug = String(formData.get("confirmSlug") ?? "").trim().toLowerCase();
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!product) return { ok: false, error: "Product not found." };
    if (confirmSlug !== product.slug.toLowerCase()) {
      return {
        ok: false,
        error: "Slug confirmation must match exactly (lowercase).",
      };
    }
    const orders = await prisma.orderItem.count({ where: { productId: id } });
    if (orders > 0) {
      return {
        ok: false,
        error:
          "This product has order history and cannot be deleted. Hide it instead.",
      };
    }
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/admin/categories");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function createProductImageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return { ok: false, error: "Missing product." };

  const parsed = imageInputSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    type: String(formData.get("type") ?? "GALLERY"),
    altEn: String(formData.get("altEn") ?? ""),
    altAr: String(formData.get("altAr") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await prisma.productImage.create({
      data: {
        productId,
        url: parsed.data.url.trim(),
        type: parsed.data.type,
        altEn: parsed.data.altEn,
        altAr: parsed.data.altAr,
        sortOrder: parsed.data.sortOrder,
      },
    });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function updateProductImageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { ok: false, error: "Missing image." };

  const parsed = imageInputSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    type: String(formData.get("type") ?? "GALLERY"),
    altEn: String(formData.get("altEn") ?? ""),
    altAr: String(formData.get("altAr") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await prisma.productImage.update({
      where: { id },
      data: {
        url: parsed.data.url.trim(),
        type: parsed.data.type,
        altEn: parsed.data.altEn,
        altAr: parsed.data.altAr,
        sortOrder: parsed.data.sortOrder,
      },
    });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deleteProductImageAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id || !productId) return { ok: false, error: "Missing image." };
  try {
    await prisma.productImage.delete({ where: { id } });
    revalidateProductPaths(productId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

function redirectToProduct(productId: string): never {
  redirect(`/admin/products/${productId}`);
}

function redirectProductsList(): never {
  redirect("/admin/products");
}

export async function createProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await createProductAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirectToProduct(r.productId);
}

export async function updateProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await updateProductAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!id) {
    return { error: "Missing product." };
  }
  redirectToProduct(id);
}

export async function createProductSizeFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await createProductSizeAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function updateProductSizeFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await updateProductSizeAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function deactivateProductSizeFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await deactivateProductSizeAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function deleteProductSizeFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await deleteProductSizeAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function hideProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await hideProductAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing product." };
  redirectToProduct(id);
}

export async function soldOutProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await soldOutProductAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing product." };
  redirectToProduct(id);
}

export async function activateProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await activateProductAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing product." };
  redirectToProduct(id);
}

export async function deleteProductFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await deleteProductAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirectProductsList();
}

export async function createProductImageFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await createProductImageAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function updateProductImageFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await updateProductImageAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}

export async function deleteProductImageFormAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const r = await deleteProductImageAction(formData);
  const productId = String(formData.get("productId") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!productId) {
    return { error: "Missing product." };
  }
  redirectToProduct(productId);
}
