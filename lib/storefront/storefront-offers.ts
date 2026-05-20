import "server-only";

import { prisma } from "@/lib/db/prisma";

import type { StorefrontOffer } from "./types";

function decimalToNumber(value: { toString(): string }): number {
  return Number(value.toString());
}

function isOfferCurrentlyValid(row: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): boolean {
  if (!row.isActive) return false;
  const now = new Date();
  if (row.startsAt && now < row.startsAt) return false;
  if (row.endsAt && now > row.endsAt) return false;
  return true;
}

function mapOfferRow(row: {
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceOmr: { toString(): string };
  imageUrl: string | null;
}): StorefrontOffer {
  return {
    slug: row.slug,
    title: { en: row.titleEn, ar: row.titleAr },
    description: { en: row.descriptionEn, ar: row.descriptionAr },
    priceOmr: decimalToNumber(row.priceOmr),
    imageUrl: row.imageUrl?.trim() ? row.imageUrl.trim() : null,
  };
}

export async function getFeaturedHomeOffer(): Promise<StorefrontOffer | null> {
  const rows = await prisma.offer.findMany({
    where: { isActive: true, featuredOnHome: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  const match = rows.find((row) => isOfferCurrentlyValid(row));
  return match ? mapOfferRow(match) : null;
}

export async function listActiveStorefrontOffers(): Promise<StorefrontOffer[]> {
  const rows = await prisma.offer.findMany({
    where: { isActive: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rows.filter(isOfferCurrentlyValid).map(mapOfferRow);
}
