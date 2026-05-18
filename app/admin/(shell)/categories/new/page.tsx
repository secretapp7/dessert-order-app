import Link from "next/link";

import { CategoryCreateForm } from "@/components/admin/categories/category-forms";

export default function AdminNewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">New category</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Slug must be unique, lowercase, and URL-safe (letters, numbers, hyphens).
          </p>
        </div>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>
      <CategoryCreateForm />
    </div>
  );
}
