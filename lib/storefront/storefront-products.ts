import "server-only";

import { ProductStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getFeaturedPresentation } from "@/data/products";

import {
  mapDbProductToStorefront,
  mapStaticProductsToStorefront,
  isStorefrontProductOrderable,
} from "./storefront-mappers";
import type { MenuCategory } from "@/data/products";
import type { StorefrontMenuData, StorefrontProduct } from "./types";
import { getStorefrontRatingSummaries } from "./storefront-reviews";

const PUBLIC_PRODUCT_INCLUDE = {
  category: { select: { slug: true, nameEn: true, nameAr: true, isActive: true } },
  sizes: true,
  images: true,
} as const;

const PUBLIC_STATUS_WHERE = {
  status: { in: [ProductStatus.ACTIVE, ProductStatus.SOLD_OUT] },
};

async function countPublicProducts(): Promise<number> {
  return prisma.product.count({ where: PUBLIC_STATUS_WHERE });
}

async function loadDbStorefrontProducts(): Promise<StorefrontProduct[]> {
  const rows = await prisma.product.findMany({
    where: PUBLIC_STATUS_WHERE,
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    include: PUBLIC_PRODUCT_INCLUDE,
  });

  return rows
    .map((row) => mapDbProductToStorefront(row))
    .filter((p): p is StorefrontProduct => p != null);
}

export async function listStorefrontProducts(): Promise<{
  products: StorefrontProduct[];
  dataSource: "database" | "static";
}> {
  const count = await countPublicProducts();
  if (count === 0) {
    return { products: mapStaticProductsToStorefront(), dataSource: "static" };
  }
  return { products: await loadDbStorefrontProducts(), dataSource: "database" };
}

export async function listOrderableStorefrontProducts(): Promise<StorefrontProduct[]> {
  const { products } = await listStorefrontProducts();
  return products.filter(isStorefrontProductOrderable);
}

export async function getStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProduct | null> {
  const count = await countPublicProducts();
  if (count === 0) {
    const staticProduct = mapStaticProductsToStorefront().find((p) => p.id === slug);
    return staticProduct ?? null;
  }

  const row = await prisma.product.findUnique({
    where: { slug },
    include: PUBLIC_PRODUCT_INCLUDE,
  });

  if (!row) return null;
  return mapDbProductToStorefront(row);
}

export async function getProductDbIdBySlug(slug: string): Promise<string | null> {
  const count = await countPublicProducts();
  if (count === 0) return null;
  const row = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  return row?.id ?? null;
}

export function buildMenuCategoryIds(products: StorefrontProduct[]): Array<MenuCategory | "all"> {
  const slugs = new Set(products.map((p) => p.menuCategory));
  const ids: Array<MenuCategory | "all"> = ["all"];
  const ordered: MenuCategory[] = ["cakes", "cups", "trays", "offers"];
  for (const id of ordered) {
    if (slugs.has(id)) ids.push(id);
  }
  return ids;
}

export async function getStorefrontMenuData(): Promise<StorefrontMenuData> {
  const [{ products, dataSource }, ratingSummaries] = await Promise.all([
    listStorefrontProducts(),
    getStorefrontRatingSummaries(),
  ]);
  return {
    products,
    categoryIds: buildMenuCategoryIds(products),
    dataSource,
    ratingSummaries,
  };
}

export async function getStorefrontFeaturedPresentation(product: StorefrontProduct) {
  return getFeaturedPresentation(product);
}
