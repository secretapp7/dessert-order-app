import type { Offer } from "@prisma/client";

import { dateToUtcDatetimeLocal, decimalToFormString } from "@/lib/admin/admin-serialize";

/** JSON-safe offer row for admin client forms. */
export type OfferAdminClientRecord = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  priceOmr: string;
  imageUrl: string | null;
  startsAtLocal: string;
  endsAtLocal: string;
  isActive: boolean;
  featuredOnHome: boolean;
};

export function serializeOfferForAdmin(offer: Offer): OfferAdminClientRecord {
  return {
    id: offer.id,
    slug: offer.slug,
    titleEn: offer.titleEn,
    titleAr: offer.titleAr,
    descriptionEn: offer.descriptionEn,
    descriptionAr: offer.descriptionAr,
    priceOmr: decimalToFormString(offer.priceOmr),
    imageUrl: offer.imageUrl,
    startsAtLocal: dateToUtcDatetimeLocal(offer.startsAt),
    endsAtLocal: dateToUtcDatetimeLocal(offer.endsAt),
    isActive: offer.isActive,
    featuredOnHome: offer.featuredOnHome,
  };
}
