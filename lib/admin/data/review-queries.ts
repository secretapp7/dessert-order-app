import "server-only";

import { Prisma, ReviewStatus, ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  serializeReviewForAdmin,
  type ReviewAdminClientRecord,
  type ReviewListRow,
} from "@/lib/admin/data/review-serialize";

export type ReviewListFilters = {
  search?: string;
  status?: "all" | "approved" | "pending" | "hidden";
  featured?: "all" | "yes" | "no";
  productId?: string;
  rating?: number;
  sort?: "newest" | "oldest" | "rating_high" | "rating_low" | "featured_first";
};

export type ReviewProductOption = {
  id: string;
  slug: string;
  nameEn: string;
};

export type ReviewDashboardSummary = {
  approvedCount: number;
  pendingCount: number;
  averageRating: number;
};

function statusFilter(status: ReviewListFilters["status"]): ReviewStatus | undefined {
  if (status === "approved") return ReviewStatus.APPROVED;
  if (status === "pending") return ReviewStatus.PENDING;
  if (status === "hidden") return ReviewStatus.HIDDEN;
  return undefined;
}

function buildWhere(filters: ReviewListFilters): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = {};

  const status = statusFilter(filters.status);
  if (status) where.status = status;

  if (filters.featured === "yes") where.featured = true;
  if (filters.featured === "no") where.featured = false;

  if (filters.productId === "none") {
    where.productId = null;
  } else if (filters.productId && filters.productId !== "all") {
    where.productId = filters.productId;
  }

  if (filters.rating && filters.rating >= 1 && filters.rating <= 5) {
    where.rating = filters.rating;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { customerName: { contains: q, mode: "insensitive" } },
      { customerNameAr: { contains: q, mode: "insensitive" } },
      { textEn: { contains: q, mode: "insensitive" } },
      { textAr: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: ReviewListFilters["sort"]): Prisma.ReviewOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "rating_high":
      return [{ rating: "desc" }, { createdAt: "desc" }];
    case "rating_low":
      return [{ rating: "asc" }, { createdAt: "desc" }];
    case "featured_first":
      return [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listReviews(filters: ReviewListFilters = {}): Promise<ReviewListRow[]> {
  const rows = await prisma.review.findMany({
    where: buildWhere(filters),
    include: { product: { select: { slug: true, nameEn: true } } },
    orderBy: buildOrderBy(filters.sort),
  });
  return rows.map(serializeReviewForAdmin);
}

export async function getReviewById(id: string): Promise<ReviewAdminClientRecord | null> {
  const row = await prisma.review.findUnique({
    where: { id },
    include: { product: { select: { slug: true, nameEn: true } } },
  });
  return row ? serializeReviewForAdmin(row) : null;
}

export async function getReviewProductOptions(): Promise<ReviewProductOption[]> {
  const products = await prisma.product.findMany({
    where: { status: { not: ProductStatus.HIDDEN } },
    select: { id: true, slug: true, nameEn: true },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });
  return products;
}

export async function getReviewDashboardSummary(): Promise<ReviewDashboardSummary> {
  const [approvedCount, pendingCount, avg] = await Promise.all([
    prisma.review.count({ where: { status: ReviewStatus.APPROVED } }),
    prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
    prisma.review.aggregate({
      where: { status: ReviewStatus.APPROVED },
      _avg: { rating: true },
    }),
  ]);

  const averageRating = avg._avg.rating ?? 0;
  return {
    approvedCount,
    pendingCount,
    averageRating: Math.round(averageRating * 10) / 10,
  };
}
