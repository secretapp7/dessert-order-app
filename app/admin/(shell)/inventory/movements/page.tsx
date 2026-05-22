import Link from "next/link";
import { InventoryMovementType } from "@prisma/client";

import {
  getInventoryItemsForAdmin,
  getInventoryMovementsForAdmin,
  parseYmdUtcEnd,
  parseYmdUtcStart,
} from "@/lib/admin/data/inventory-queries";
import { INVENTORY_UNIT_LABELS, MOVEMENT_TYPE_LABELS } from "@/lib/admin/inventory-serialize";

function money(n: number | null) {
  if (n == null) return "—";
  return n.toFixed(3);
}

export default async function AdminInventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; type?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const itemId = typeof sp.item === "string" ? sp.item : undefined;
  const typeRaw = typeof sp.type === "string" ? sp.type : "";
  const type =
    typeRaw && Object.values(InventoryMovementType).includes(typeRaw as InventoryMovementType)
      ? (typeRaw as InventoryMovementType)
      : undefined;
  const from = parseYmdUtcStart(typeof sp.from === "string" ? sp.from : undefined);
  const to = parseYmdUtcEnd(typeof sp.to === "string" ? sp.to : undefined);

  const [items, movements] = await Promise.all([
    getInventoryItemsForAdmin({ active: "all", sort: "name" }),
    getInventoryMovementsForAdmin({ itemId, type, from, to, limit: 300 }),
  ]);

  const baseParams = new URLSearchParams();
  if (itemId) baseParams.set("item", itemId);
  if (type) baseParams.set("type", type);
  if (typeof sp.from === "string" && sp.from) baseParams.set("from", sp.from);
  if (typeof sp.to === "string" && sp.to) baseParams.set("to", sp.to);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Stock movements</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Audit trail of stock in, out, waste, and corrections.
          </p>
        </div>
        <Link
          href="/admin/inventory"
          className="text-sm font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          ← Inventory
        </Link>
      </div>

      <form method="get" className="grid gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-[11px] font-semibold text-[color:var(--muted-text)]">
          Item
          <select name="item" defaultValue={itemId ?? ""} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm">
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[color:var(--muted-text)]">
          Type
          <select name="type" defaultValue={type ?? ""} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm">
            <option value="">All types</option>
            {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-[color:var(--muted-text)]">
          From (UTC)
          <input name="from" type="date" defaultValue={typeof sp.from === "string" ? sp.from : ""} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-[11px] font-semibold text-[color:var(--muted-text)]">
          To (UTC)
          <input name="to" type="date" defaultValue={typeof sp.to === "string" ? sp.to : ""} className="mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm" />
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <button type="submit" className="rounded-lg bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]">
            Apply filters
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-[color:var(--card-beige)] text-[10px] font-bold uppercase text-[color:var(--muted-text)]">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Quantity</th>
              <th className="px-3 py-2">Total cost</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border-soft)]">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No movements match these filters.
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-[11px]">{m.movementDateIso.slice(0, 16).replace("T", " ")}</td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/inventory/${m.itemId}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline">
                      {m.itemName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[11px]">{MOVEMENT_TYPE_LABELS[m.type]}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {m.quantity.toFixed(3)} {INVENTORY_UNIT_LABELS[m.unit]}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{money(m.totalCostOmr)}</td>
                  <td className="px-3 py-2 text-[11px]">{m.reason ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
