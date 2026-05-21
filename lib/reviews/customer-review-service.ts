import "server-only";

import { ReviewStatus, type Order, type OrderItem } from "@prisma/client";

import type { AppLanguage } from "@/config/translations";

import { prisma } from "@/lib/db/prisma";
import { uiLanguageFromPrisma, isPrismaArabic } from "@/lib/language/prisma-language";
import { deriveCustomerInitials } from "@/lib/storefront/review-display";
import { revalidatePath } from "next/cache";

import type { CustomerReviewSubmitInput } from "./customer-review-validation";

export type CustomerReviewPageState =
  | { kind: "invalid" }
  | { kind: "already_reviewed"; language: AppLanguage }
  | {
      kind: "ready";
      publicId: string;
      token: string;
      customerName: string;
      language: AppLanguage;
      productOptions: Array<{ productId: string | null; labelEn: string; labelAr: string }>;
      defaultProductId: string | null;
    };

const INVALID: CustomerReviewPageState = { kind: "invalid" };

function uniqueProductOptions(items: OrderItem[]) {
  const seen = new Set<string>();
  const out: Array<{ productId: string; labelEn: string; labelAr: string }> = [];
  for (const item of items) {
    if (!item.productId || seen.has(item.productId)) continue;
    seen.add(item.productId);
    out.push({
      productId: item.productId,
      labelEn: item.productNameEn,
      labelAr: item.productNameAr,
    });
  }
  return out;
}

export async function getCustomerReviewPageState(
  publicId: string | undefined,
  token: string | undefined,
): Promise<CustomerReviewPageState> {
  const pid = publicId?.trim();
  const tok = token?.trim();
  if (!pid || !tok) return INVALID;

  const order = await prisma.order.findUnique({
    where: { publicId: pid },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!order?.reviewToken || order.reviewToken !== tok) return INVALID;
  if (order.reviewedAt) {
    return { kind: "already_reviewed", language: uiLanguageFromPrisma(order.language) };
  }

  const products = uniqueProductOptions(order.items);
  const defaultProductId = products.length === 1 ? products[0]!.productId : null;

  return {
    kind: "ready",
    publicId: order.publicId,
    token: order.reviewToken,
    customerName: order.customerName,
    language: uiLanguageFromPrisma(order.language),
    productOptions: [
      ...products.map((p) => ({
        productId: p.productId as string | null,
        labelEn: p.labelEn,
        labelAr: p.labelAr,
      })),
      { productId: null, labelEn: "General order", labelAr: "الطلب بشكل عام" },
    ],
    defaultProductId,
  };
}

function productBelongsToOrder(items: OrderItem[], productId: string | null): boolean {
  if (productId == null) return true;
  return items.some((i) => i.productId === productId);
}

export async function submitCustomerOrderReview(
  input: CustomerReviewSubmitInput,
): Promise<{ ok: true } | { ok: false; error: "invalid" | "already_reviewed" | "validation" }> {
  const order = await prisma.order.findUnique({
    where: { publicId: input.publicId.trim() },
    include: { items: true },
  });

  if (!order?.reviewToken || order.reviewToken !== input.token.trim()) {
    return { ok: false, error: "invalid" };
  }
  if (order.reviewedAt) {
    return { ok: false, error: "already_reviewed" };
  }
  if (!productBelongsToOrder(order.items, input.productId)) {
    return { ok: false, error: "invalid" };
  }

  const isAr = isPrismaArabic(order.language);
  const textEn = input.comment;
  const textAr = isAr ? input.comment : null;

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.order.findUnique({
        where: { id: order.id },
        select: { reviewedAt: true, reviewToken: true },
      });
      if (!locked?.reviewToken || locked.reviewToken !== input.token.trim() || locked.reviewedAt) {
        throw new Error("REVIEW_LOCKED");
      }

      await tx.review.create({
        data: {
          productId: input.productId,
          customerName: input.customerName,
          customerInitials: deriveCustomerInitials(input.customerName),
          rating: input.rating,
          textEn,
          textAr,
          source: "Order review",
          verifiedOrder: true,
          featured: false,
          sortOrder: 0,
          reviewDate: new Date(),
          status: ReviewStatus.PENDING,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { reviewedAt: new Date() },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "REVIEW_LOCKED") {
      return { ok: false, error: "already_reviewed" };
    }
    return { ok: false, error: "invalid" };
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  revalidatePath(`/review/${order.publicId}`);

  return { ok: true };
}

export type OrderReviewAdminInfo = Pick<
  Order,
  "id" | "publicId" | "customerName" | "customerPhone" | "language" | "orderStatus" | "reviewRequestedAt" | "reviewedAt" | "reviewToken"
>;
