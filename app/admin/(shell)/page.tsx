import Link from "next/link";

import { getAvailabilityDashboardBrief } from "@/lib/admin/data/availability-dashboard";
import { getProductionDashboardSummary } from "@/lib/admin/data/production-queries";
import { getReviewDashboardSummary } from "@/lib/admin/data/review-queries";
import { getAdminDashboardSnapshot } from "@/lib/admin/dashboard-data";

function money(n: number) {
  return n.toFixed(3);
}

export default async function AdminDashboardPage() {
  const [data, avail, production, reviews] = await Promise.all([
    getAdminDashboardSnapshot(),
    getAvailabilityDashboardBrief(),
    getProductionDashboardSummary(),
    getReviewDashboardSummary(),
  ]);
  const p = data.profitBrief;

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

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Production planning ({production.tomorrowIso} UTC)
          </h2>
          <Link
            href="/admin/production"
            className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            View production board
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MiniStat title="Orders tomorrow" value={String(production.tomorrowOrders)} />
          <MiniStat title="Units tomorrow" value={String(production.tomorrowUnits)} />
          <MiniStat
            title="Top item tomorrow"
            value={
              production.topItemTomorrow
                ? `${production.topItemTomorrow.label} ×${production.topItemTomorrow.quantity}`
                : "—"
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Reviews & testimonials
          </h2>
          <Link
            href="/admin/reviews"
            className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Manage reviews
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MiniStat title="Approved" value={String(reviews.approvedCount)} />
          <MiniStat title="Pending" value={String(reviews.pendingCount)} />
          <MiniStat title="Avg. rating (approved)" value={reviews.averageRating > 0 ? String(reviews.averageRating) : "—"} />
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--muted-text)]">
          Only approved reviews appear on the home page, menu cards, and product detail pages.
          {reviews.pendingCount > 0 ? (
            <>
              {" "}
              <Link
                href="/admin/reviews?status=pending"
                className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
              >
                {reviews.pendingCount} pending to review
              </Link>
            </>
          ) : null}
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            This month (UTC) — dessert subtotal
          </h2>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">
            {money(data.monthDessertRevenue)} OMR
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">Cancelled orders excluded.</p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            This month (UTC) — total charged
          </h2>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">
            {money(data.monthTotalRevenue)} OMR
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
            Sum of stored order totals (includes delivery fee when set). Cancelled orders excluded.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Month snapshot ({p.monthLabel} UTC)
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <MiniStat title="Expenses · void excluded" value={`${money(p.expensesTotal)} OMR`} />
          <MiniStat title="Est. net profit" value={`${money(p.estimatedNetProfit)} OMR`} />
          <MiniStat title="Unpaid orders" value={String(p.unpaidCount)} />
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--muted-text)]">
          Net profit ≈ revenue (excl. cancelled) minus estimated COGS ({money(p.estimatedCogs)} OMR) minus expenses recorded
          for the month by <span className="font-medium">expenseDate</span>. See the profit report for full tables.
          {p.suspiciousZeroCost ? (
            <>
              {" "}
              <span className="text-[color:var(--brand-burgundy-soft)]">Some line items still show zero unit cost.</span>
            </>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          <Link
            href="/admin/reports/profit"
            className="text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Profit report
          </Link>
          <Link
            href="/admin/expenses"
            className="text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Expenses
          </Link>
          <Link
            href="/admin/offers"
            className="text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Offers
          </Link>
          <Link
            href="/admin/availability"
            className="text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Availability
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Capacity & kitchen prep (UTC)
          </h2>
          <Link
            href="/admin/availability"
            className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Manage availability
          </Link>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            title={`Today · ${avail.todayIso}`}
            value={`${avail.todayRow.usedSlots} / ${avail.todayRow.maxOrders > 0 ? avail.todayRow.maxOrders : "∞"} · ${avail.todayRow.status}`}
          />
          <MiniStat
            title={`Tomorrow · ${avail.tomorrowIso}`}
            value={`${avail.tomorrowRow.usedSlots} / ${avail.tomorrowRow.maxOrders > 0 ? avail.tomorrowRow.maxOrders : "∞"} · ${avail.tomorrowRow.status}`}
          />
          <MiniStat
            title="Next fully booked day"
            value={
              avail.nextFullyBooked
                ? `${avail.nextFullyBooked.dateIso} (${avail.nextFullyBooked.status})`
                : "None in scan window"
            }
          />
          <MiniStat
            title="Next scheduled closures"
            value={
              avail.upcomingClosed[0]
                ? `${avail.upcomingClosed[0].startsAt.toISOString().slice(0, 10)}→${avail.upcomingClosed[0].endsAt.toISOString().slice(0, 10)}`
                : "—"
            }
          />
        </div>
        <div className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Tomorrow production mix (non-cancelled)
          </p>
          {avail.tomorrowProduction.length === 0 ? (
            <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">Nothing scheduled yet.</p>
          ) : (
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-[11px] text-[color:var(--foreground)]">
              {avail.tomorrowProduction.slice(0, 12).map((row) => (
                <li key={row.label} className="flex justify-between gap-2 tabular-nums">
                  <span className="min-w-0 truncate">{row.label}</span>
                  <span className="shrink-0 font-semibold">×{row.qty}</span>
                </li>
              ))}
            </ul>
          )}
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
          <p className="mt-2 text-[11px] text-[color:var(--muted-text)]">Cancelled orders excluded from counts.</p>
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

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border-soft)] bg-white/80 px-3 py-2 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">{title}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">{value}</p>
    </div>
  );
}
