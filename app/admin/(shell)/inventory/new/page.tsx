import Link from "next/link";

import { InventoryItemCreateForm } from "@/components/admin/inventory/inventory-forms";
import { getInventoryCategoriesForAdmin } from "@/lib/admin/data/inventory-queries";

export default async function AdminInventoryNewPage() {
  const categories = await getInventoryCategoriesForAdmin({ active: "active" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Add inventory item</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Initial quantity creates a stock-in movement automatically.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-sm font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          ← Inventory
        </Link>
      </div>
      <InventoryItemCreateForm
        categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, type: c.type }))}
      />
    </div>
  );
}
