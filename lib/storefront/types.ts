import type { LocalizedText, MenuCategory, Product, ProductImages, ProductImageAlt } from "@/data/products";

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
  offerIsFromDatabase: boolean;
};

export type StorefrontMenuData = {
  products: StorefrontProduct[];
  categoryIds: Array<MenuCategory | "all">;
  dataSource: "database" | "static";
};

export type { ProductImages, ProductImageAlt, LocalizedText, MenuCategory };
