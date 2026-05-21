"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { z } from "zod";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import { offerCoreSchema } from "@/lib/admin/validation/offer-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { revalidateStorefrontPaths } from "@/lib/storefront/revalidate-storefront";
import { revalidateAdminReports } from "@/lib/admin/revalidate-reports";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateOfferResult = { ok: true; offerId: string } | { ok: false; error: string };

export type OfferFormState = AdminFormState;

function friendlyPrismaError(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    return "That slug is already in use.";
  }
  return "Something went wrong. Please try again.";
}

function parseOfferPayload(formData: FormData) {
  return {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    titleEn: String(formData.get("titleEn") ?? ""),
    titleAr: String(formData.get("titleAr") ?? ""),
    descriptionEn: String(formData.get("descriptionEn") ?? ""),
    descriptionAr: String(formData.get("descriptionAr") ?? ""),
    priceOmr: String(formData.get("priceOmr") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    isActive: formData.has("isActive"),
    featuredOnHome: formData.has("featuredOnHome"),
  };
}

function redirectToOffer(id: string): never {
  redirect(`/admin/offers/${id}`);
}

function redirectOffersList(): never {
  redirect("/admin/offers");
}

function decimalsFromOffer(data: z.infer<typeof offerCoreSchema>) {
  return {
    titleEn: data.titleEn.trim(),
    titleAr: data.titleAr.trim(),
    descriptionEn: data.descriptionEn.trim(),
    descriptionAr: data.descriptionAr.trim(),
    priceOmr: new Prisma.Decimal(String(data.priceOmr)),
    imageUrl: data.imageUrl ?? null,
    startsAt: data.startsAt ?? null,
    endsAt: data.endsAt ?? null,
    isActive: data.isActive,
    featuredOnHome: data.featuredOnHome,
  };
}

function revalidateOfferPaths(id: string) {
  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${id}`);
  revalidateAdminReports();
  revalidateStorefrontPaths();
}

export async function createOfferAction(formData: FormData): Promise<CreateOfferResult> {
  await requireAdmin();
  const parsed = offerCoreSchema.safeParse(parseOfferPayload(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const d = decimalsFromOffer(parsed.data);
    const offer = await prisma.offer.create({
      data: {
        slug: parsed.data.slug,
        ...d,
      },
    });
    revalidateOfferPaths(offer.id);
    return { ok: true, offerId: offer.id };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function updateOfferAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing offer." };

  const parsed = offerCoreSchema.safeParse(parseOfferPayload(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const d = decimalsFromOffer(parsed.data);
    await prisma.offer.update({
      where: { id },
      data: {
        slug: parsed.data.slug,
        ...d,
      },
    });
    revalidateOfferPaths(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

async function setOfferFlags(
  formData: FormData,
  patch: Pick<Prisma.OfferUpdateInput, "isActive" | "featuredOnHome">,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing offer." };
  try {
    const row = await prisma.offer.findUnique({ where: { id }, select: { id: true } });
    if (!row) return { ok: false, error: "Offer not found." };
    await prisma.offer.update({ where: { id }, data: patch });
    revalidateOfferPaths(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function activateOfferAction(formData: FormData): Promise<ActionResult> {
  return setOfferFlags(formData, { isActive: true });
}

export async function deactivateOfferAction(formData: FormData): Promise<ActionResult> {
  return setOfferFlags(formData, { isActive: false });
}

export async function featureOfferAction(formData: FormData): Promise<ActionResult> {
  return setOfferFlags(formData, { featuredOnHome: true });
}

export async function unfeatureOfferAction(formData: FormData): Promise<ActionResult> {
  return setOfferFlags(formData, { featuredOnHome: false });
}

export async function deleteOfferAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const confirmSlug = String(formData.get("confirmSlug") ?? "").trim().toLowerCase();
  if (!id) return { ok: false, error: "Missing offer." };
  if (!formData.has("confirmDelete")) {
    return { ok: false, error: "Confirm deletion before continuing." };
  }
  try {
    const offer = await prisma.offer.findUnique({ where: { id }, select: { slug: true } });
    if (!offer) return { ok: false, error: "Offer not found." };
    if (confirmSlug !== offer.slug.toLowerCase()) {
      return { ok: false, error: "Slug confirmation must match exactly (lowercase)." };
    }
    await prisma.offer.delete({ where: { id } });
    revalidatePath("/admin/offers");
    revalidatePath(`/admin/offers/${id}`);
    revalidateAdminReports();
    revalidateStorefrontPaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyPrismaError(e) };
  }
}

export async function createOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await createOfferAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirectToOffer(r.offerId);
}

export async function updateOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await updateOfferAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) {
    return { error: r.error };
  }
  if (!id) {
    return { error: "Missing offer." };
  }
  redirectToOffer(id);
}

export async function activateOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await activateOfferAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing offer." };
  redirectToOffer(id);
}

export async function deactivateOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await deactivateOfferAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing offer." };
  redirectToOffer(id);
}

export async function featureOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await featureOfferAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing offer." };
  redirectToOffer(id);
}

export async function unfeatureOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await unfeatureOfferAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing offer." };
  redirectToOffer(id);
}

export async function deleteOfferFormAction(
  _prev: OfferFormState,
  formData: FormData,
): Promise<OfferFormState> {
  const r = await deleteOfferAction(formData);
  if (!r.ok) {
    return { error: r.error };
  }
  redirectOffersList();
}
