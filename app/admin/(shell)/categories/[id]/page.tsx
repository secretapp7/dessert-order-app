import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryEditForm } from "@/components/admin/categories/category-forms";
import { getCategoryForAdmin } from "@/lib/admin/data/catalog-queries";

export default async function AdminEditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await getCategoryForAdmin(id);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit category</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--muted-text)]">{category.slug}</p>
        </div>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>
      <CategoryEditForm category={category} />
    </div>
  );
}
