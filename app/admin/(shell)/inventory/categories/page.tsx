import Link from "next/link";

import {
  InventoryCategoryForm,
  InventoryCategoryRowActions,
} from "@/components/admin/inventory/inventory-forms";
import { getInventoryCategoriesForAdmin } from "@/lib/admin/data/inventory-queries";
import { INVENTORY_TYPE_LABELS } from "@/lib/admin/inventory-serialize";

export default async function AdminInventoryCategoriesPage() {
  const categories = await getInventoryCategoriesForAdmin({ active: "all" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Inventory categories</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Group ingredients, packaging, and supplies.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-sm font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          ← Inventory
        </Link>
      </div>

      <InventoryCategoryForm />

      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-4 py-8 text-center text-sm text-[color:var(--muted-text)]">
            No categories yet. Add one above or run seed for defaults.
          </p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[color:var(--accent-cocoa)]">{cat.nameEn}</p>
                  <p className="text-[11px] text-[color:var(--muted-text)]">
                    {INVENTORY_TYPE_LABELS[cat.type]} · {cat.slug} · {cat.itemCount} items ·{" "}
                    {cat.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
              <InventoryCategoryForm category={cat} />
              <InventoryCategoryRowActions category={cat} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
