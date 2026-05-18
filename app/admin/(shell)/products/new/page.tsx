import Link from "next/link";

import { ProductCreateForm } from "@/components/admin/products/product-create-form";
import { getCategoriesForSelect } from "@/lib/admin/data/catalog-queries";

export default async function AdminNewProductPage() {
  const categories = await getCategoriesForSelect();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">New product</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Create a product and its first size. You can add more sizes and images after saving.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>
      <ProductCreateForm
        categories={categories.map((c) => ({ id: c.id, slug: c.slug, nameEn: c.nameEn }))}
      />
    </div>
  );
}
