import Link from "next/link";

import { getAdminDashboardSnapshot } from "@/lib/admin/dashboard-data";

function money(n: number) {
  return n.toFixed(3);
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardSnapshot();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-text)]">
          Live metrics from PostgreSQL (UTC calendar day and month).
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Orders today (UTC)" value={String(data.ordersToday)} />
        <StatCard title="In progress (NEW→READY)" value={String(data.pendingOrders)} />
        <StatCard title="Delivered (all time)" value={String(data.deliveredCount)} />
        <StatCard title="Cancelled (all time)" value={String(data.cancelledCount)} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            This month (UTC) — dessert subtotal
          </h2>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">
            {money(data.monthDessertRevenue)} OMR
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            This month (UTC) — total charged
          </h2>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">
            {money(data.monthTotalRevenue)} OMR
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
            Sum of stored order totals (includes delivery fee when set).
          </p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            This month — fulfillment split
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[color:var(--card-cream)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-[color:var(--muted-text)]">Pickup</p>
              <p className="text-xl font-bold tabular-nums">{data.pickupMonth}</p>
            </div>
            <div className="rounded-xl bg-[color:var(--card-cream)] px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-[color:var(--muted-text)]">Delivery</p>
              <p className="text-xl font-bold tabular-nums">{data.deliveryMonth}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Best-selling product (by units)
          </h2>
          {data.bestSeller ? (
            <p className="mt-3 text-lg font-semibold text-[color:var(--accent-cocoa)]">
              {data.bestSeller.label}{" "}
              <span className="text-sm font-normal text-[color:var(--muted-text)]">
                — {data.bestSeller.units} sold
              </span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--muted-text)]">No line items with linked products yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            View all
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-[color:var(--border-soft)]">
          {data.recentOrders.length === 0 ? (
            <li className="py-3 text-sm text-[color:var(--muted-text)]">No orders yet.</li>
          ) : (
            data.recentOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                  >
                    {o.publicId}
                  </Link>
                  <span className="ml-2 text-[color:var(--muted-text)]">{o.customerName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="rounded-full bg-[color:var(--card-cream)] px-2 py-0.5 font-medium">
                    {o.orderStatus}
                  </span>
                  <span className="tabular-nums font-semibold">{money(Number(o.totalOmr))} OMR</span>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">{value}</p>
    </div>
  );
}
