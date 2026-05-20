"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import { requireAdmin } from "@/lib/auth/admin-session";
import { categoryInputSchema } from "@/lib/admin/validation/catalog";
import { prisma } from "@/lib/db/prisma";
import { revalidateStorefrontPaths } from "@/lib/storefront/revalidate-storefront";

export type ActionResult = { ok: true } | { ok: false; error: string };

function friendlyPrismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "That slug is already in use.";
  }
  return "Something went wrong. Please try again.";
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categoryInputSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionAr: String(formData.get("descriptionAr") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.has("isActive"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ") || "Invalid input.";
    return { ok: false, error: msg };
  }
  try {
    await prisma.category.create({
      data: {
        slug: parsed.data.slug,
        nameEn: parsed.data.nameEn.trim(),
        nameAr: parsed.data.nameAr.trim(),
        descriptionEn: parsed.data.descriptionEn,
        descriptionAr: parsed.data.descriptionAr,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin");
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export type CategoryFormState = AdminFormState;

export async function createCategoryFormAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const r = await createCategoryAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirect("/admin/categories");
}

export async function updateCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing category." };
  const parsed = categoryInputSchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionAr: String(formData.get("descriptionAr") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    isActive: formData.has("isActive"),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(" ") || "Invalid input.";
    return { ok: false, error: msg };
  }
  try {
    await prisma.category.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        nameEn: parsed.data.nameEn.trim(),
        nameAr: parsed.data.nameAr.trim(),
        descriptionEn: parsed.data.descriptionEn,
        descriptionAr: parsed.data.descriptionAr,
        sortOrder: parsed.data.sortOrder,
        isActive: parsed.data.isActive,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin");
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

function redirectToCategoryEdit(id: string): never {
  redirect(`/admin/categories/${id}`);
}

export async function updateCategoryFormAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const r = await updateCategoryAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!id) {
    redirect("/admin/categories");
  }
  redirectToCategoryEdit(id);
}

export async function deactivateCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing category." };
  try {
    const row = await prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!row) return { ok: false, error: "Category not found." };
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function activateCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing category." };
  try {
    const row = await prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!row) return { ok: false, error: "Category not found." };
    await prisma.category.update({ where: { id }, data: { isActive: true } });
    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing category." };
  const confirmSlug = String(formData.get("confirmSlug") ?? "").trim().toLowerCase();
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { slug: true, _count: { select: { products: true } } },
    });
    if (!category) return { ok: false, error: "Category not found." };
    if (confirmSlug !== category.slug.toLowerCase()) {
      return { ok: false, error: "Slug confirmation must match exactly (lowercase)." };
    }
    if (category._count.products > 0) {
      return {
        ok: false,
        error:
          "This category has products and cannot be deleted. Deactivate it or move products first.",
      };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/categories/${id}`);
    revalidatePath("/admin");
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function deactivateCategoryFormAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const r = await deactivateCategoryAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing category." };
  redirectToCategoryEdit(id);
}

export async function activateCategoryFormAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const r = await activateCategoryAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing category." };
  redirectToCategoryEdit(id);
}

export async function deleteCategoryFormAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const r = await deleteCategoryAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirect("/admin/categories");
}
