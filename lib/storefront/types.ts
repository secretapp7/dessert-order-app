import type { LocalizedText, MenuCategory, Product, ProductImages, ProductImageAlt } from "@/data/products";
import type { ProductRatingSummary, StorefrontReview } from "@/lib/storefront/review-display";

/** Public catalog visibility — HIDDEN never appears on the storefront. */
export type StorefrontProductStatus = "ACTIVE" | "SOLD_OUT";

export type StorefrontProduct = Product & {
  status: StorefrontProductStatus;
  /** From DB `Product.featured`; static fallback sets known hero items. */
  featuredOnHome: boolean;
};

export type StorefrontOffer = {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  priceOmr: number;
  imageUrl: string | null;
};

export type StorefrontHomeData = {
  signatures: StorefrontProduct[];
  featured: StorefrontProduct | null;
  featuredPresentation: { src: string; alt: LocalizedText } | null;
  offer: StorefrontOffer | null;
  featuredReviews: StorefrontReview[];
  globalRating: ProductRatingSummary;
  ratingSummaries: Record<string, ProductRatingSummary>;
};

export type StorefrontMenuData = {
  products: StorefrontProduct[];
  categoryIds: Array<MenuCategory | "all">;
  dataSource: "database" | "static";
  ratingSummaries: Record<string, ProductRatingSummary>;
};

export type { ProductImages, ProductImageAlt, LocalizedText, MenuCategory };
