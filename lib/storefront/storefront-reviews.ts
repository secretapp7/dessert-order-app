import "server-only";

import { ReviewStatus, type Review } from "@prisma/client";

import {
  getAverageRating as staticAverage,
  getFeaturedReviews as staticFeatured,
  getReviewCount as staticCount,
  getReviewsForProductDetail as staticProductReviews,
  type Review as StaticReview,
} from "@/data/reviews";
import { prisma } from "@/lib/db/prisma";
import {
  formatReviewDateLabel,
  type ProductRatingSummary,
  type StorefrontReview,
} from "@/lib/storefront/review-display";

type ReviewWithProduct = Review & {
  product: { slug: string } | null;
};

function mapStaticReview(r: StaticReview): StorefrontReview {
  return {
    id: r.id,
    customerName: r.customerName,
    customerInitials: r.customerInitials,
    rating: r.rating,
    productSlug: r.productId === "general" ? null : r.productId,
    text: { en: r.text.en, ar: r.text.ar },
    dateLabel: { en: r.dateLabel.en, ar: r.dateLabel.ar },
    verifiedOrder: r.verifiedOrder,
  };
}

function mapDbReview(row: ReviewWithProduct): StorefrontReview {
  const when = row.reviewDate ?? row.createdAt;
  return {
    id: row.id,
    customerName: row.customerName,
    customerInitials: row.customerInitials,
    rating: row.rating,
    productSlug: row.product?.slug ?? null,
    text: {
      en: row.textEn,
      ar: row.textAr?.trim() ? row.textAr : row.textEn,
    },
    dateLabel: {
      en: formatReviewDateLabel(when, "en"),
      ar: formatReviewDateLabel(when, "ar"),
    },
    verifiedOrder: row.verifiedOrder,
  };
}

async function countApprovedReviews(): Promise<number> {
  return prisma.review.count({ where: { status: ReviewStatus.APPROVED } });
}

export async function getFeaturedStorefrontReviews(limit: number): Promise<StorefrontReview[]> {
  const approvedCount = await countApprovedReviews();
  if (approvedCount === 0) {
    return staticFeatured(limit).map(mapStaticReview);
  }

  const rows = await prisma.review.findMany({
    where: { status: ReviewStatus.APPROVED },
    include: { product: { select: { slug: true } } },
    orderBy: [
      { featured: "desc" },
      { sortOrder: "asc" },
      { rating: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  const featured = rows.filter((r) => r.featured);
  const pool = featured.length >= limit ? featured : rows;
  return pool.slice(0, limit).map(mapDbReview);
}

export async function getProductStorefrontReviews(
  productSlug: string,
  productDbId: string | null,
  limit: number,
): Promise<StorefrontReview[]> {
  const approvedCount = await countApprovedReviews();

  if (approvedCount === 0) {
    if (productSlug === "tiramisu" || productSlug === "jelly-cheesecake") {
      return staticProductReviews(productSlug, limit).map(mapStaticReview);
    }
    return [];
  }

  if (!productDbId) {
    return [];
  }

  const rows = await prisma.review.findMany({
    where: {
      status: ReviewStatus.APPROVED,
      OR: [{ productId: productDbId }, { productId: null }],
    },
    include: { product: { select: { slug: true } } },
    orderBy: [
      { featured: "desc" },
      { sortOrder: "asc" },
      { rating: "desc" },
      { createdAt: "desc" },
    ],
    take: limit + 8,
  });

  const specific = rows.filter((r) => r.productId === productDbId);
  const general = rows.filter((r) => r.productId == null);
  const mapped = [...specific, ...general].slice(0, limit).map(mapDbReview);
  if (mapped.length === 0) {
    return getFeaturedStorefrontReviews(limit);
  }
  return mapped;
}

export async function getStorefrontRatingSummaries(): Promise<Record<string, ProductRatingSummary>> {
  const approvedCount = await countApprovedReviews();
  if (approvedCount === 0) {
    const slugs = ["tiramisu", "jelly-cheesecake"] as const;
    const out: Record<string, ProductRatingSummary> = {};
    for (const slug of slugs) {
      out[slug] = { average: staticAverage(slug), count: staticCount(slug) };
    }
    out.global = { average: staticAverage(), count: staticCount() };
    return out;
  }

  const rows = await prisma.review.findMany({
    where: { status: ReviewStatus.APPROVED },
    select: { rating: true, productId: true, product: { select: { slug: true } } },
  });

  const buckets = new Map<string, number[]>();
  for (const row of rows) {
    const key = row.product?.slug ?? "_global";
    const list = buckets.get(key) ?? [];
    list.push(row.rating);
    buckets.set(key, list);
    const global = buckets.get("_global") ?? [];
    global.push(row.rating);
    buckets.set("_global", global);
  }

  const out: Record<string, ProductRatingSummary> = {};
  for (const [key, ratings] of buckets) {
    if (ratings.length === 0) continue;
    const sum = ratings.reduce((a, b) => a + b, 0);
    out[key === "_global" ? "global" : key] = {
      average: Math.round((sum / ratings.length) * 10) / 10,
      count: ratings.length,
    };
  }
  return out;
}

export { ratingForProductSlug } from "@/lib/storefront/review-display";
