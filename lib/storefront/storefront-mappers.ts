import "server-only";

import type { ProductImageType, ProductStatus } from "@prisma/client";

import {
  products as staticProducts,
  type LocalizedText,
  type MenuCategory,
  type Product,
  type ProductImageAlt,
  type ProductImages,
} from "@/data/products";

import type { StorefrontProduct, StorefrontProductStatus } from "./types";

const VISUAL_GRADIENTS = [
  "from-[#E7C97A] via-[#6B0F22] to-[#5A0016]",
  "from-[#E7C97A] via-[#7A1128] to-[#5A0016]",
  "from-[#F0D48A] via-[#5A0016] to-[#3D0010]",
  "from-[#D4B56A] via-[#8B1530] to-[#5A0016]",
] as const;

const MENU_CATEGORY_SLUGS = new Set<MenuCategory>(["cakes", "cups", "trays", "offers"]);

function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function initialsFromName(nameEn: string): string {
  const parts = nameEn.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return nameEn.trim().slice(0, 2).toUpperCase() || "CT";
}

function gradientForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash + slug.charCodeAt(i)) % VISUAL_GRADIENTS.length;
  }
  return VISUAL_GRADIENTS[hash]!;
}

function menuCategoryFromSlug(slug: string | null | undefined): MenuCategory {
  if (slug && MENU_CATEGORY_SLUGS.has(slug as MenuCategory)) {
    return slug as MenuCategory;
  }
  return "cakes";
}

function localized(en: string, ar: string): LocalizedText {
  return { en, ar };
}

type DbImageRow = {
  type: ProductImageType;
  url: string;
  altEn: string | null;
  altAr: string | null;
  sortOrder: number;
};

type DbSizeRow = {
  id: string;
  labelEn: string;
  labelAr: string;
  servesEn: string;
  servesAr: string;
  priceOmr: { toString(): string };
  sortOrder: number;
  isActive: boolean;
};

type DbProductRow = {
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  badgeEn: string | null;
  badgeAr: string | null;
  status: ProductStatus;
  featured: boolean;
  category: { slug: string } | null;
  sizes: DbSizeRow[];
  images: DbImageRow[];
};

function pickImageByType(images: DbImageRow[], type: ProductImageType): DbImageRow | undefined {
  return images
    .filter((img) => img.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

function buildImagesFromDb(
  slug: string,
  images: DbImageRow[],
  staticFallback: Product | undefined,
): { images: ProductImages; imageAlt: ProductImageAlt } {
  const mainRow = pickImageByType(images, "MAIN");
  const featuredRow = pickImageByType(images, "FEATURED");

  const galleryRows = images
    .filter((img) => ["GALLERY", "CLOSEUP", "TRAY"].includes(img.type))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const mainUrl = mainRow?.url?.trim() || staticFallback?.images.main || "";
  const featuredUrl =
    featuredRow?.url?.trim() || staticFallback?.images.featured || undefined;

  const galleryUrls: string[] = [];
  const galleryAlts: LocalizedText[] = [];

  const pushGallery = (url: string, alt: LocalizedText) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (galleryUrls.includes(trimmed)) return;
    galleryUrls.push(trimmed);
    galleryAlts.push(alt);
  };

  if (mainUrl) {
    pushGallery(
      mainUrl,
      mainRow
        ? localized(mainRow.altEn ?? staticFallback?.imageAlt.main.en ?? "", mainRow.altAr ?? staticFallback?.imageAlt.main.ar ?? "")
        : staticFallback?.imageAlt.main ?? localized("", ""),
    );
  }

  for (const row of galleryRows) {
    pushGallery(
      row.url,
      localized(row.altEn ?? "", row.altAr ?? ""),
    );
  }

  if (galleryUrls.length === 0 && staticFallback?.images.gallery.length) {
    for (let i = 0; i < staticFallback.images.gallery.length; i++) {
      pushGallery(staticFallback.images.gallery[i]!, staticFallback.imageAlt.gallery[i] ?? staticFallback.imageAlt.main);
    }
  }

  while (galleryUrls.length < 3) {
    galleryUrls.push("");
    galleryAlts.push(staticFallback?.imageAlt.main ?? localized("", ""));
  }

  return {
    images: {
      main: mainUrl,
      featured: featuredUrl,
      gallery: galleryUrls.slice(0, 3),
    },
    imageAlt: {
      main: mainRow
        ? localized(mainRow.altEn ?? slug, mainRow.altAr ?? slug)
        : staticFallback?.imageAlt.main ?? localized(slug, slug),
      featured: featuredRow
        ? localized(featuredRow.altEn ?? slug, featuredRow.altAr ?? slug)
        : staticFallback?.imageAlt.featured,
      gallery: galleryAlts.slice(0, 3),
    },
  };
}

export function mapDbProductToStorefront(row: DbProductRow): StorefrontProduct | null {
  if (row.status === "HIDDEN") return null;

  const status: StorefrontProductStatus =
    row.status === "SOLD_OUT" ? "SOLD_OUT" : "ACTIVE";

  const staticFallback = staticProducts.find((p) => p.id === row.slug);
  const { images, imageAlt } = buildImagesFromDb(row.slug, row.images, staticFallback);

  const activeSizes = row.sizes
    .filter((s) => s.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({
      id: s.id,
      label: localized(s.labelEn, s.labelAr),
      serves: localized(s.servesEn, s.servesAr),
      priceOmr: decimalToNumber(s.priceOmr),
    }));

  if (activeSizes.length === 0 && !staticFallback?.sizes.length) {
    return null;
  }

  const sizes =
    activeSizes.length > 0
      ? activeSizes
      : (staticFallback?.sizes ?? []);

  const badge =
    row.badgeEn || row.badgeAr
      ? localized(row.badgeEn ?? row.badgeAr ?? "", row.badgeAr ?? row.badgeEn ?? "")
      : staticFallback?.badge ?? localized("Coco Treats", "كوكو تريتس");

  return {
    id: row.slug,
    name: localized(row.nameEn, row.nameAr),
    description: localized(row.descriptionEn, row.descriptionAr),
    badge,
    images,
    imageAlt,
    fallbackInitials: staticFallback?.fallbackInitials ?? initialsFromName(row.nameEn),
    visualGradient: staticFallback?.visualGradient ?? gradientForSlug(row.slug),
    menuCategory: menuCategoryFromSlug(row.category?.slug),
    sizes,
    status,
    featuredOnHome: row.featured,
  };
}

export function mapStaticProductsToStorefront(): StorefrontProduct[] {
  return staticProducts.map((p) => ({
    ...p,
    status: "ACTIVE" as const,
    featuredOnHome: p.id === "tiramisu",
  }));
}

export function isStorefrontProductOrderable(product: StorefrontProduct): boolean {
  return product.status === "ACTIVE" && product.sizes.length > 0;
}
