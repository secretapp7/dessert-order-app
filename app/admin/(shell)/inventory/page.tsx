import Link from "next/link";
import { InventoryItemType } from "@prisma/client";

import {
  getInventoryDashboardSummary,
  getInventoryItemsForAdmin,
  type InventoryItemListFilter,
} from "@/lib/admin/data/inventory-queries";
import {
  INVENTORY_TYPE_LABELS,
  INVENTORY_UNIT_LABELS,
} from "@/lib/admin/inventory-serialize";

function money(n: number) {
  return n.toFixed(3);
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    active?: string;
    low?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const typeRaw = typeof sp.type === "string" ? sp.type : "";
  const type =
    typeRaw && Object.values(InventoryItemType).includes(typeRaw as InventoryItemType)
      ? (typeRaw as InventoryItemType)
      : undefined;

  const activeRaw = typeof sp.active === "string" ? sp.active : "";
  const active: InventoryItemListFilter["active"] =
    activeRaw === "inactive" || activeRaw === "all" ? activeRaw : "active";

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: InventoryItemListFilter["sort"] =
    sortRaw === "newest" ||
    sortRaw === "low_stock" ||
    sortRaw === "quantity" ||
    sortRaw === "value"
      ? sortRaw
      : "name";

  const lowStockOnly = sp.low === "1";

  const [summary, rows] = await Promise.all([
    getInventoryDashboardSummary(),
    getInventoryItemsForAdmin({ q, type, active, sort, lowStockOnly }),
  ]);

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (type) baseParams.set("type", type);
  if (active !== "active") baseParams.set("active", active);
  if (sort !== "name") baseParams.set("sort", sort);
  if (lowStockOnly) baseParams.set("low", "1");

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/inventory?${qs}` : "/admin/inventory";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Inventory</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Ingredients, packaging, supplies, and stock movements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/inventory/new" className={primaryBtn}>
            Add item
          </Link>
          <Link href="/admin/inventory/categories" className={outlineBtn}>
            Categories
          </Link>
          <Link href="/admin/inventory/movements" className={outlineBtn}>
            Movements
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Mini title="Active items" value={String(summary.totalActiveItems)} />
        <Mini title="Low stock" value={String(summary.lowStockCount)} warn={summary.lowStockCount > 0} />
        <Mini title="Est. stock value" value={`${money(summary.totalEstimatedValueOmr)} OMR`} />
        <Mini title="Ingredients" value={String(summary.ingredientCount)} />
        <Mini title="Packaging" value={String(summary.packagingCount)} />
      </section>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className="text-[11px] font-semibold text-[color:var(--muted-text)]">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, SKU, supplier…"
            className="mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        {type ? <input type="hidden" name="type" value={type} /> : null}
        {active !== "active" ? <input type="hidden" name="active" value={active} /> : null}
        {sort !== "name" ? <input type="hidden" name="sort" value={sort} /> : null}
        {lowStockOnly ? <input type="hidden" name="low" value="1" /> : null}
        <button type="submit" className={primaryBtn}>
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link href={hrefWith({ low: lowStockOnly ? undefined : "1" })} className={pill(lowStockOnly)}>
          Low stock only
        </Link>
        {(["all", "active", "inactive"] as const).map((key) => (
          <Link key={key} href={hrefWith({ active: key === "active" ? undefined : key })} className={pill(active === key)}>
            {key === "all" ? "All status" : key === "active" ? "Active" : "Inactive"}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="self-center text-[color:var(--muted-text)]">Type:</span>
        <Link href={hrefWith({ type: undefined })} className={pill(!type)}>
          All
        </Link>
        {Object.entries(INVENTORY_TYPE_LABELS).map(([k, label]) => (
          <Link key={k} href={hrefWith({ type: k })} className={pill(type === k)}>
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Low at</th>
              <th className="px-3 py-2">Unit cost</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Supplier</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border-soft)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No inventory items yet. Add your first ingredient or packaging item.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-[color:var(--card-cream)]/60">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/inventory/${row.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {row.nameEn}
                    </Link>
                    {row.sku ? <p className="text-[10px] text-[color:var(--muted-text)]">{row.sku}</p> : null}
                    {row.isLowStock ? (
                      <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-950">
                        Low stock
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-[11px]">
                    {INVENTORY_TYPE_LABELS[row.type]}
                    {row.categoryName ? <p className="text-[10px] text-[color:var(--muted-text)]">{row.categoryName}</p> : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {row.currentQuantity.toFixed(3)} {INVENTORY_UNIT_LABELS[row.unit]}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[11px]">
                    {row.lowStockThreshold != null ? row.lowStockThreshold.toFixed(3) : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[11px]">
                    {row.averageUnitCostOmr != null ? money(row.averageUnitCostOmr) : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[11px]">{money(row.estimatedValueOmr)}</td>
                  <td className="max-w-[8rem] truncate px-3 py-2 text-[11px]">{row.supplierName ?? "—"}</td>
                  <td className="px-3 py-2 text-[11px]">{row.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const primaryBtn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]";
const outlineBtn =
  "rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)]";

function pill(active: boolean) {
  return `rounded-full px-3 py-1 font-semibold ${
    active
      ? "bg-[color:var(--brand-burgundy)] text-[color:var(--card-cream)]"
      : "border border-[color:var(--border-soft)] bg-white text-[color:var(--brand-burgundy)]"
  }`;
}

function Mini({ title, value, warn }: { title: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">{title}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${warn ? "text-amber-800" : "text-[color:var(--accent-cocoa)]"}`}>
        {value}
      </p>
    </div>
  );
}
