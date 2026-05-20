import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  serializeOfferForAdmin,
  type OfferAdminClientRecord,
} from "@/lib/admin/offer-admin-record";

export type OfferListFilters = {
  q?: string;
  active?: "yes" | "no" | "all";
  featured?: "yes" | "no" | "all";
  sort: "updated" | "created" | "start";
};

export async function getOffersForAdmin(filters: OfferListFilters) {
  const where: Prisma.OfferWhereInput = {};

  const act = filters.active ?? "all";
  if (act === "yes") where.isActive = true;
  if (act === "no") where.isActive = false;

  const feat = filters.featured ?? "all";
  if (feat === "yes") where.featuredOnHome = true;
  if (feat === "no") where.featuredOnHome = false;

  if (filters.q?.trim()) {
    const s = filters.q.trim();
    where.OR = [
      { slug: { contains: s, mode: "insensitive" } },
      { titleEn: { contains: s, mode: "insensitive" } },
      { titleAr: { contains: s, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.OfferOrderByWithRelationInput | Prisma.OfferOrderByWithRelationInput[] =
    filters.sort === "created"
      ? { createdAt: "desc" }
      : filters.sort === "start"
        ? [{ startsAt: "asc" }, { createdAt: "desc" }]
        : { updatedAt: "desc" };

  return prisma.offer.findMany({
    where,
    orderBy,
  });
}

export async function getOfferForAdmin(id: string): Promise<OfferAdminClientRecord | null> {
  const row = await prisma.offer.findUnique({ where: { id } });
  return row ? serializeOfferForAdmin(row) : null;
}
