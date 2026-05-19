import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ProductCoreEditForm,
  ProductImagesSection,
  ProductSizesSection,
  type SerializedImage,
  type SerializedSize,
} from "@/components/admin/products/product-edit-forms";
import { ProductLifecycleSection } from "@/components/admin/products/product-lifecycle-section";
import { getCategoriesForSelect, getProductForAdmin } from "@/lib/admin/data/catalog-queries";

function omr(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(3) : "0.000";
}

export default async function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductForAdmin(id), getCategoriesForSelect()]);

  if (!product) notFound();

  const sizes: SerializedSize[] = product.sizes.map((s) => ({
    id: s.id,
    labelEn: s.labelEn,
    labelAr: s.labelAr,
    servesEn: s.servesEn,
    servesAr: s.servesAr,
    priceOmr: omr(s.priceOmr),
    ingredientCostOmr: omr(s.ingredientCostOmr),
    packagingCostOmr: omr(s.packagingCostOmr),
    laborCostOmr: omr(s.laborCostOmr),
    sortOrder: s.sortOrder,
    isActive: s.isActive,
  }));

  const images: SerializedImage[] = product.images.map((im) => ({
    id: im.id,
    type: im.type,
    url: im.url,
    altEn: im.altEn,
    altAr: im.altAr,
    sortOrder: im.sortOrder,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit product</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--muted-text)]">{product.slug}</p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ProductLifecycleSection productId={product.id} slug={product.slug} />
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Core details</h2>
        <div className="mt-3 max-w-3xl">
          <ProductCoreEditForm
            product={{
              id: product.id,
              slug: product.slug,
              nameEn: product.nameEn,
              nameAr: product.nameAr,
              descriptionEn: product.descriptionEn,
              descriptionAr: product.descriptionAr,
              categoryId: product.categoryId,
              status: product.status,
              badgeEn: product.badgeEn,
              badgeAr: product.badgeAr,
              featured: product.featured,
              sortOrder: product.sortOrder,
            }}
            categories={categories.map((c) => ({ id: c.id, slug: c.slug, nameEn: c.nameEn }))}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ProductSizesSection productId={product.id} sizes={sizes} />
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ProductImagesSection productId={product.id} productSlug={product.slug} images={images} />
      </section>
    </div>
  );
}
