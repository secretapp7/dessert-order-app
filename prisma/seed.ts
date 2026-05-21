import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient, Prisma, ProductImageType, ReviewStatus } from "@prisma/client";

import { translations } from "../config/translations";
import { products as staticProducts } from "../data/products";
import { reviews as staticReviews } from "../data/reviews";
import { AVAILABILITY_KEYS } from "../lib/availability/availability-keys";
import { getDefaultBusinessSettingValues } from "../lib/settings/defaults";
import { ALL_BUSINESS_SETTING_KEYS } from "../lib/settings/settings-keys";

/** Loads `.env.local` then `.env` so `npm run prisma:seed` finds DATABASE_URL like Next.js. */
function mergeEnvFile(relativePath: string) {
  const full = resolve(process.cwd(), relativePath);
  if (!existsSync(full)) return;
  const raw = readFileSync(full, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

mergeEnvFile(".env.local");
mergeEnvFile(".env");

const prisma = new PrismaClient();

const categoryDefs = [
  { slug: "cakes", sortOrder: 0 },
  { slug: "cups", sortOrder: 1 },
  { slug: "trays", sortOrder: 2 },
  { slug: "offers", sortOrder: 3 },
] as const;

function bilingualNoteJson(en: string, ar: string) {
  return JSON.stringify({ en, ar });
}

function imageRowsForProduct(
  product: (typeof staticProducts)[number],
): Array<{
  type: ProductImageType;
  url: string;
  altEn?: string;
  altAr?: string;
  sortOrder: number;
}> {
  const rows: Array<{
    type: ProductImageType;
    url: string;
    altEn?: string;
    altAr?: string;
    sortOrder: number;
  }> = [];

  rows.push({
    type: "MAIN",
    url: product.images.main.trim(),
    altEn: product.imageAlt.main.en,
    altAr: product.imageAlt.main.ar,
    sortOrder: 0,
  });

  let sortOrder = 1;
  const featured = product.images.featured?.trim();
  if (featured) {
    rows.push({
      type: "FEATURED",
      url: featured,
      altEn: product.imageAlt.featured?.en,
      altAr: product.imageAlt.featured?.ar,
      sortOrder: sortOrder++,
    });
  }

  const gallery = product.images.gallery;
  const galleryAlt = product.imageAlt.gallery;
  if (gallery[1]?.trim()) {
    rows.push({
      type: "CLOSEUP",
      url: gallery[1].trim(),
      altEn: galleryAlt[1]?.en,
      altAr: galleryAlt[1]?.ar,
      sortOrder: sortOrder++,
    });
  }
  if (gallery[2]?.trim()) {
    rows.push({
      type: "TRAY",
      url: gallery[2].trim(),
      altEn: galleryAlt[2]?.en,
      altAr: galleryAlt[2]?.ar,
      sortOrder: sortOrder++,
    });
  }

  const g0 = gallery[0]?.trim();
  if (g0 && g0 !== product.images.main.trim()) {
    rows.push({
      type: "GALLERY",
      url: g0,
      altEn: galleryAlt[0]?.en,
      altAr: galleryAlt[0]?.ar,
      sortOrder: sortOrder++,
    });
  }

  return rows;
}

async function main() {
  const categoriesBySlug = new Map<string, { id: string }>();

  for (const def of categoryDefs) {
    const slug = def.slug;
    const nameEn =
      translations.en.home.categories[slug as keyof typeof translations.en.home.categories];
    const nameAr =
      translations.ar.home.categories[slug as keyof typeof translations.ar.home.categories];

    const row = await prisma.category.upsert({
      where: { slug },
      create: {
        slug,
        nameEn,
        nameAr,
        sortOrder: def.sortOrder,
        isActive: true,
      },
      update: {
        nameEn,
        nameAr,
        sortOrder: def.sortOrder,
        isActive: true,
      },
    });
    categoriesBySlug.set(slug, { id: row.id });
  }

  let productSort = 0;
  for (const p of staticProducts) {
    const categoryId = categoriesBySlug.get(p.menuCategory)?.id ?? null;

    const product = await prisma.product.upsert({
      where: { slug: p.id },
      create: {
        slug: p.id,
        nameEn: p.name.en,
        nameAr: p.name.ar,
        descriptionEn: p.description.en,
        descriptionAr: p.description.ar,
        categoryId,
        badgeEn: p.badge.en,
        badgeAr: p.badge.ar,
        featured: true,
        sortOrder: productSort++,
        status: "ACTIVE",
      },
      update: {
        nameEn: p.name.en,
        nameAr: p.name.ar,
        descriptionEn: p.description.en,
        descriptionAr: p.description.ar,
        categoryId,
        badgeEn: p.badge.en,
        badgeAr: p.badge.ar,
        featured: true,
        sortOrder: productSort - 1,
        status: "ACTIVE",
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });

    await prisma.productImage.createMany({
      data: imageRowsForProduct(p).map((row) => ({
        productId: product.id,
        type: row.type,
        url: row.url,
        altEn: row.altEn,
        altAr: row.altAr,
        sortOrder: row.sortOrder,
      })),
    });

    await prisma.productSize.deleteMany({ where: { productId: product.id } });

    let sizeSort = 0;
    for (const size of p.sizes) {
      await prisma.productSize.create({
        data: {
          productId: product.id,
          labelEn: size.label.en,
          labelAr: size.label.ar,
          servesEn: size.serves.en,
          servesAr: size.serves.ar,
          priceOmr: new Prisma.Decimal(size.priceOmr),
          sortOrder: sizeSort++,
          isActive: true,
        },
      });
    }
  }

  const defaults = getDefaultBusinessSettingValues();
  const settingEntries: Array<{ key: string; value: string }> = [
    ...ALL_BUSINESS_SETTING_KEYS.map((key) => ({ key, value: defaults[key] ?? "" })),
    {
      key: "note_preorder",
      value: bilingualNoteJson(
        translations.en.businessNotes.preorder24h,
        translations.ar.businessNotes.preorder24h,
      ),
    },
    {
      key: "note_delivery_fee",
      value: bilingualNoteJson(
        translations.en.businessNotes.deliveryFeeWhatsApp,
        translations.ar.businessNotes.deliveryFeeWhatsApp,
      ),
    },
    {
      key: "note_payment",
      value: bilingualNoteJson(
        translations.en.businessNotes.paymentWhatsApp,
        translations.ar.businessNotes.paymentWhatsApp,
      ),
    },
  ];

  await prisma.businessSetting.createMany({
    data: settingEntries,
    skipDuplicates: true,
  });

  await prisma.availabilitySetting.createMany({
    data: [
      { key: AVAILABILITY_KEYS.minimumNoticeDays, value: "2" },
      { key: AVAILABILITY_KEYS.defaultDailyOrderLimit, value: "5" },
      { key: AVAILABILITY_KEYS.largeOrderNoticeDays, value: "4" },
      { key: AVAILABILITY_KEYS.largeOrderQuantityThreshold, value: "5" },
    ],
    skipDuplicates: true,
  });

  const productsBySlug = new Map(
    (await prisma.product.findMany({ select: { id: true, slug: true } })).map((p) => [p.slug, p.id]),
  );

  for (const r of staticReviews) {
    const existing = await prisma.review.findUnique({ where: { id: r.id } });
    if (existing) continue;

    const productSlug = r.productId === "general" ? null : r.productId;
    const productId = productSlug ? (productsBySlug.get(productSlug) ?? null) : null;

    await prisma.review.create({
      data: {
        id: r.id,
        productId,
        customerName: r.customerName,
        customerInitials: r.customerInitials,
        rating: r.rating,
        textEn: r.text.en,
        textAr: r.text.ar,
        source: "Manual",
        verifiedOrder: r.verifiedOrder,
        featured: r.rating >= 5,
        sortOrder: 0,
        status: ReviewStatus.APPROVED,
      },
    });
  }

  console.log("Seed finished: categories, products, sizes, images, business_settings, availability defaults, reviews (skip existing).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
