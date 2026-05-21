"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, ReviewStatus } from "@prisma/client";
import type { z } from "zod";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import {
  reviewCoreSchema,
  reviewCreateSchema,
  reviewDeleteSchema,
  reviewIdSchema,
  reviewUpdateSchema,
} from "@/lib/admin/validation/review-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { deriveCustomerInitials } from "@/lib/storefront/review-display";
import { revalidateStorefrontPaths } from "@/lib/storefront/revalidate-storefront";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateReviewResult = { ok: true; reviewId: string } | { ok: false; error: string };

export type ReviewFormState = AdminFormState;

function friendlyPrismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003") return "Linked product was not found.";
    if (e.code === "P2025") return "Review not found.";
  }
  return "Something went wrong. Please try again.";
}

function parseReviewDateYmd(ymd: string | null | undefined): Date | null {
  if (!ymd?.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function parseReviewPayload(formData: FormData) {
  const statusRaw = String(formData.get("status") ?? "").trim();
  let status: "APPROVED" | "PENDING" | "HIDDEN" = formData.has("isApproved") ? "APPROVED" : "PENDING";
  if (statusRaw === "APPROVED" || statusRaw === "PENDING" || statusRaw === "HIDDEN") {
    status = statusRaw;
  }

  return {
    productId: String(formData.get("productId") ?? "").trim(),
    customerName: String(formData.get("customerName") ?? ""),
    customerNameAr: String(formData.get("customerNameAr") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    textEn: String(formData.get("textEn") ?? formData.get("commentEn") ?? ""),
    textAr: String(formData.get("textAr") ?? formData.get("commentAr") ?? ""),
    source: String(formData.get("source") ?? ""),
    reviewDate: String(formData.get("reviewDate") ?? ""),
    verifiedOrder: formData.has("verifiedOrder"),
    featured: formData.has("featured") || formData.has("isFeatured"),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    status,
  };
}

async function assertProductExists(productId: string | undefined): Promise<string | null> {
  if (!productId) return null;
  const row = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!row) throw new Error("PRODUCT_NOT_FOUND");
  return productId;
}

function reviewWriteData(data: z.infer<typeof reviewCoreSchema>) {
  return {
    productId: data.productId ?? null,
    customerName: data.customerName,
    customerNameAr: data.customerNameAr,
    customerInitials: deriveCustomerInitials(data.customerName),
    rating: data.rating,
    textEn: data.textEn,
    textAr: data.textAr,
    source: data.source,
    verifiedOrder: data.verifiedOrder,
    featured: data.featured,
    sortOrder: data.sortOrder,
    reviewDate: parseReviewDateYmd(data.reviewDate),
    status: data.status as ReviewStatus,
  };
}

async function productSlugForReview(productId: string | null): Promise<string | null> {
  if (!productId) return null;
  const row = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  return row?.slug ?? null;
}

function revalidateReviewPaths(reviewId?: string, productSlug?: string | null) {
  revalidatePath("/admin/reviews");
  if (reviewId) revalidatePath(`/admin/reviews/${reviewId}`);
  revalidatePath("/admin");
  revalidateStorefrontPaths(productSlug);
}

function redirectToReview(id: string): never {
  redirect(`/admin/reviews/${id}`);
}

function redirectReviewsList(): never {
  redirect("/admin/reviews");
}

export async function createReviewAction(formData: FormData): Promise<CreateReviewResult> {
  await requireAdmin();
  const parsed = reviewCreateSchema.safeParse(parseReviewPayload(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await assertProductExists(parsed.data.productId);
    const review = await prisma.review.create({ data: reviewWriteData(parsed.data) });
    const slug = await productSlugForReview(review.productId);
    revalidateReviewPaths(review.id, slug);
    return { ok: true, reviewId: review.id };
  } catch (e) {
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return { ok: false, error: "Selected product was not found." };
    }
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function updateReviewAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const payload = { ...parseReviewPayload(formData), id: String(formData.get("id") ?? "") };
  const parsed = reviewUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    await assertProductExists(parsed.data.productId);
    const existing = await prisma.review.findUnique({
      where: { id: parsed.data.id },
      select: { productId: true },
    });
    if (!existing) return { ok: false, error: "Review not found." };

    await prisma.review.update({
      where: { id: parsed.data.id },
      data: reviewWriteData(parsed.data),
    });

    const oldSlug = await productSlugForReview(existing.productId);
    const newSlug = await productSlugForReview(parsed.data.productId ?? null);
    revalidateReviewPaths(parsed.data.id, newSlug ?? oldSlug);
    if (oldSlug && oldSlug !== newSlug) revalidateStorefrontPaths(oldSlug);
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "PRODUCT_NOT_FOUND") {
      return { ok: false, error: "Selected product was not found." };
    }
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

async function patchReview(
  formData: FormData,
  patch: Prisma.ReviewUpdateInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewIdSchema.safeParse({ id: String(formData.get("id") ?? "") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const row = await prisma.review.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, productId: true },
    });
    if (!row) return { ok: false, error: "Review not found." };
    await prisma.review.update({ where: { id: parsed.data.id }, data: patch });
    const slug = await productSlugForReview(row.productId);
    revalidateReviewPaths(parsed.data.id, slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function approveReviewAction(formData: FormData): Promise<ActionResult> {
  return patchReview(formData, { status: ReviewStatus.APPROVED });
}

export async function hideReviewAction(formData: FormData): Promise<ActionResult> {
  return patchReview(formData, { status: ReviewStatus.HIDDEN });
}

export async function featureReviewAction(formData: FormData): Promise<ActionResult> {
  return patchReview(formData, { featured: true });
}

export async function unfeatureReviewAction(formData: FormData): Promise<ActionResult> {
  return patchReview(formData, { featured: false });
}

export async function deleteReviewAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reviewDeleteSchema.safeParse({
    id: String(formData.get("id") ?? ""),
    confirmName: String(formData.get("confirmName") ?? ""),
    confirmDelete: formData.has("confirmDelete") ? "on" : undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const row = await prisma.review.findUnique({
      where: { id: parsed.data.id },
      select: { customerName: true, productId: true },
    });
    if (!row) return { ok: false, error: "Review not found." };
    if (parsed.data.confirmName.trim() !== row.customerName.trim()) {
      return { ok: false, error: "Customer name confirmation must match exactly." };
    }
    const slug = await productSlugForReview(row.productId);
    await prisma.review.delete({ where: { id: parsed.data.id } });
    revalidateReviewPaths(parsed.data.id, slug);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function createReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await createReviewAction(formData);
  if (!r.ok) return { error: r.error };
  redirectToReview(r.reviewId);
}

export async function updateReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await updateReviewAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing review." };
  redirectToReview(id);
}

export async function approveReviewQuickAction(formData: FormData): Promise<void> {
  const r = await approveReviewAction(formData);
  if (!r.ok) redirectReviewsList();
  redirectReviewsList();
}

export async function hideReviewQuickAction(formData: FormData): Promise<void> {
  const r = await hideReviewAction(formData);
  if (!r.ok) redirectReviewsList();
  redirectReviewsList();
}

export async function featureReviewQuickAction(formData: FormData): Promise<void> {
  const r = await featureReviewAction(formData);
  if (!r.ok) redirectReviewsList();
  redirectReviewsList();
}

export async function unfeatureReviewQuickAction(formData: FormData): Promise<void> {
  const r = await unfeatureReviewAction(formData);
  if (!r.ok) redirectReviewsList();
  redirectReviewsList();
}

export async function approveReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await approveReviewAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing review." };
  redirectToReview(id);
}

export async function hideReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await hideReviewAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing review." };
  redirectToReview(id);
}

export async function featureReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await featureReviewAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing review." };
  redirectToReview(id);
}

export async function unfeatureReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await unfeatureReviewAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing review." };
  redirectToReview(id);
}

export async function deleteReviewFormAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const r = await deleteReviewAction(formData);
  if (!r.ok) return { error: r.error };
  redirectReviewsList();
}
