import "server-only";

import { getFeaturedPresentation } from "@/data/products";

import { getFeaturedHomeOffer } from "./storefront-offers";
import {
  getFeaturedStorefrontReviews,
  getStorefrontRatingSummaries,
} from "./storefront-reviews";
import { listStorefrontProducts } from "./storefront-products";
import type { StorefrontHomeData, StorefrontProduct } from "./types";

function pickFeatured(products: StorefrontProduct[]): StorefrontProduct | null {
  const featuredActive = products.find(
    (p) => p.featuredOnHome && p.status === "ACTIVE",
  );
  if (featuredActive) return featuredActive;

  return products.find((p) => p.status === "ACTIVE") ?? null;
}

function pickSignatures(products: StorefrontProduct[], limit = 6): StorefrontProduct[] {
  const active = products.filter((p) => p.status === "ACTIVE");
  const featuredFirst = active.filter((p) => p.featuredOnHome);
  const rest = active.filter((p) => !p.featuredOnHome);
  const merged = [...featuredFirst, ...rest];
  const seen = new Set<string>();
  const out: StorefrontProduct[] = [];
  for (const p of merged) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getStorefrontHomeData(): Promise<StorefrontHomeData> {
  const { products } = await listStorefrontProducts();
  const signatures = pickSignatures(products);
  const featured = pickFeatured(products);

  const featuredPresentation = featured
    ? getFeaturedPresentation(featured)
    : null;

  const dbOffer = await getFeaturedHomeOffer();
  const [featuredReviews, ratingSummaries] = await Promise.all([
    getFeaturedStorefrontReviews(2),
    getStorefrontRatingSummaries(),
  ]);
  const globalRating = ratingSummaries.global ?? { average: 0, count: 0 };

  return {
    signatures,
    featured,
    featuredPresentation,
    offer: dbOffer,
    featuredReviews,
    globalRating,
    ratingSummaries,
  };
}
