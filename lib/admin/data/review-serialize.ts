import type { Review, ReviewStatus } from "@prisma/client";

import { dateToUtcYmd } from "@/lib/admin/admin-serialize";

export type ReviewAdminClientRecord = {
  id: string;
  productId: string | null;
  productSlug: string | null;
  productNameEn: string | null;
  customerName: string;
  customerNameAr: string | null;
  customerInitials: string;
  rating: number;
  textEn: string;
  textAr: string | null;
  source: string | null;
  verifiedOrder: boolean;
  featured: boolean;
  sortOrder: number;
  reviewDateIso: string | null;
  status: ReviewStatus;
  createdAtIso: string;
  updatedAtIso: string;
};

export type ReviewListRow = ReviewAdminClientRecord;

export function serializeReviewForAdmin(
  review: Review & { product?: { slug: string; nameEn: string } | null },
): ReviewAdminClientRecord {
  return {
    id: review.id,
    productId: review.productId,
    productSlug: review.product?.slug ?? null,
    productNameEn: review.product?.nameEn ?? null,
    customerName: review.customerName,
    customerNameAr: review.customerNameAr,
    customerInitials: review.customerInitials,
    rating: review.rating,
    textEn: review.textEn,
    textAr: review.textAr,
    source: review.source,
    verifiedOrder: review.verifiedOrder,
    featured: review.featured,
    sortOrder: review.sortOrder,
    reviewDateIso: review.reviewDate ? dateToUtcYmd(review.reviewDate) : null,
    status: review.status,
    createdAtIso: review.createdAt.toISOString(),
    updatedAtIso: review.updatedAt.toISOString(),
  };
}
