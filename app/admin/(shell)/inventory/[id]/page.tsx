import Link from "next/link";
import { notFound } from "next/navigation";

import {
  InventoryItemActions,
  InventoryItemEditForm,
  InventoryMovementForm,
} from "@/components/admin/inventory/inventory-forms";
import {
  getInventoryCategoriesForAdmin,
  getInventoryItemForAdmin,
  getInventoryMovementsForAdmin,
} from "@/lib/admin/data/inventory-queries";
import {
  INVENTORY_TYPE_LABELS,
  INVENTORY_UNIT_LABELS,
  MOVEMENT_TYPE_LABELS,
} from "@/lib/admin/inventory-serialize";

function money(n: number) {
  return n.toFixed(3);
}

export default async function AdminInventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories, movements] = await Promise.all([
    getInventoryItemForAdmin(id),
    getInventoryCategoriesForAdmin({ active: "all" }),
    getInventoryMovementsForAdmin({ itemId: id, limit: 50 }),
  ]);

  if (!item) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            {INVENTORY_TYPE_LABELS[item.type]}
            {item.categoryName ? ` · ${item.categoryName}` : ""}
          </p>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">{item.nameEn}</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {item.sku ? `SKU ${item.sku} · ` : ""}
            {item.isActive ? "Active" : "Inactive"}
            {item.isLowStock ? " · Low stock" : ""}
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-sm font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          ← Inventory
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Current quantity" value={`${item.currentQuantity.toFixed(3)} ${INVENTORY_UNIT_LABELS[item.unit]}`} warn={item.isLowStock} />
        <Card title="Low stock at" value={item.lowStockThreshold != null ? item.lowStockThreshold.toFixed(3) : "—"} />
        <Card title="Reorder qty" value={item.reorderQuantity != null ? item.reorderQuantity.toFixed(3) : "—"} />
        <Card title="Est. value" value={`${money(item.estimatedValueOmr)} OMR`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Edit item
          </h2>
          <div className="mt-4 space-y-4">
            <InventoryItemEditForm
              item={item}
              categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, type: c.type }))}
            />
            <InventoryItemActions item={item} />
          </div>
        </section>

        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Profile
          </h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Supplier" value={item.supplierName ?? "—"} />
            <Row label="Contact" value={item.supplierContact ?? "—"} />
            <Row label="Storage" value={item.storageLocation ?? "—"} />
            <Row label="Avg unit cost" value={item.averageUnitCostOmr != null ? `${money(item.averageUnitCostOmr)} OMR` : "—"} />
            <Row label="Notes" value={item.notes?.trim() || "—"} />
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Record stock movement
        </h2>
        <div className="mt-4">
          <InventoryMovementForm itemId={item.id} />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Movement history
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b text-[10px] font-bold uppercase text-[color:var(--muted-text)]">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Qty</th>
                <th className="px-2 py-2">Cost</th>
                <th className="px-2 py-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border-soft)]">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-[color:var(--muted-text)]">
                    No movements yet.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-2 py-2 text-[11px]">{m.movementDateIso.slice(0, 16).replace("T", " ")}</td>
                    <td className="px-2 py-2 text-[11px]">{MOVEMENT_TYPE_LABELS[m.type]}</td>
                    <td className="px-2 py-2 tabular-nums">
                      {m.quantity.toFixed(3)} {INVENTORY_UNIT_LABELS[m.unit]}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-[11px]">
                      {m.totalCostOmr != null ? money(m.totalCostOmr) : "—"}
                    </td>
                    <td className="px-2 py-2 text-[11px]">{m.reason ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, value, warn }: { title: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">{title}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${warn ? "text-amber-800" : "text-[color:var(--accent-cocoa)]"}`}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[color:var(--muted-text)]">{label}</dt>
      <dd className="text-end">{value}</dd>
    </div>
  );
}
