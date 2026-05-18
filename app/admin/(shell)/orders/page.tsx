import Link from "next/link";

import {
  FulfillmentMethod,
  getAdminOrdersList,
  OrderStatus,
} from "@/lib/admin/dashboard-data";

const PAGE_SIZE = 25;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    fulfillment?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const orderStatus =
    statusRaw && Object.values(OrderStatus).includes(statusRaw as OrderStatus)
      ? (statusRaw as OrderStatus)
      : undefined;

  const fulfillmentRaw = typeof sp.fulfillment === "string" ? sp.fulfillment : "";
  const fulfillmentMethod =
    fulfillmentRaw &&
    Object.values(FulfillmentMethod).includes(fulfillmentRaw as FulfillmentMethod)
      ? (fulfillmentRaw as FulfillmentMethod)
      : undefined;

  const pageNum = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const { total, rows, pageCount } = await getAdminOrdersList({
    q,
    orderStatus,
    fulfillmentMethod,
    page: pageNum,
    pageSize: PAGE_SIZE,
  });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (orderStatus) baseParams.set("status", orderStatus);
  if (fulfillmentMethod) baseParams.set("fulfillment", fulfillmentMethod);

  function hrefWithPage(p: number) {
    const next = new URLSearchParams(baseParams);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  function hrefWithFilter(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Orders</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {total} order{total === 1 ? "" : "s"} · sorted newest first
          </p>
        </div>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Public ID, name, or phone"
            className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Order status
          <select
            name="status"
            defaultValue={orderStatus ?? ""}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="">Any</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Fulfillment
          <select
            name="fulfillment"
            defaultValue={fulfillmentMethod ?? ""}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="">Any</option>
            {Object.values(FulfillmentMethod).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/orders"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Public ID</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Pay</th>
              <th className="px-3 py-2">Ship</th>
              <th className="px-3 py-2">Delivery st.</th>
              <th className="px-3 py-2">Date needed</th>
              <th className="px-3 py-2 text-right">Dessert</th>
              <th className="px-3 py-2 text-right">Fee</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60">
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {o.publicId}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{o.customerName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{o.customerPhone}</td>
                  <td className="px-3 py-2 text-xs">{o.orderStatus}</td>
                  <td className="px-3 py-2 text-xs">{o.paymentStatus}</td>
                  <td className="px-3 py-2 text-xs">{o.fulfillmentMethod}</td>
                  <td className="px-3 py-2 text-xs">{o.deliveryStatus}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">
                    {o.dateNeeded.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(o.dessertSubtotalOmr)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[color:var(--muted-text)]">
                    {o.deliveryFeeOmr != null ? fmt(o.deliveryFeeOmr) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(o.totalOmr)}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {o.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-[color:var(--muted-text)]">
            Page {pageNum} of {pageCount}
          </p>
          <div className="flex gap-2">
            {pageNum > 1 ? (
              <Link
                href={hrefWithPage(pageNum - 1)}
                className="rounded-lg border border-[color:var(--border-soft)] bg-white px-3 py-1.5 font-semibold hover:bg-[color:var(--card-cream)]"
              >
                Previous
              </Link>
            ) : null}
            {pageNum < pageCount ? (
              <Link
                href={hrefWithPage(pageNum + 1)}
                className="rounded-lg border border-[color:var(--border-soft)] bg-white px-3 py-1.5 font-semibold hover:bg-[color:var(--card-cream)]"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Quick filters:{" "}
        <FilterPill href={hrefWithFilter({ status: "NEW", page: undefined })} label="NEW" />
        {" · "}
        <FilterPill
          href={hrefWithFilter({ fulfillment: "DELIVERY", page: undefined })}
          label="Delivery"
        />
        {" · "}
        <FilterPill href={hrefWithFilter({ fulfillment: "PICKUP", page: undefined })} label="Pickup" />
      </p>
    </div>
  );
}

function fmt(d: unknown) {
  return Number(d).toFixed(3);
}

function FilterPill({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
      {label}
    </Link>
  );
}
