import Link from "next/link";

import { getProfitReportUtcMonth } from "@/lib/admin/data/profit-queries";

function omr(n: number) {
  return n.toFixed(3);
}

export default async function AdminProfitReportPage() {
  const r = await getProfitReportUtcMonth();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Profit report</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            UTC calendar month <span className="font-mono">{r.monthLabel}</span>. Revenue uses stored order totals;
            archived orders still count unless the order was cancelled.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/expenses"
            className="rounded-xl bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
          >
            Expenses
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
          >
            Orders
          </Link>
        </div>
      </div>

      {(r.suspiciousZeroCost || r.estimatedCogs === 0) && (
        <div className="rounded-2xl border border-amber-800/35 bg-[color:var(--card-cream)] px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Cost data notice</p>
          <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
            Some older orders may not include estimated cost data. COGS here is summed from{" "}
            <code className="text-xs">OrderItem.estimatedUnitCostOmr</code>; line-level profit aggregates use{" "}
            <code className="text-xs">estimatedLineProfitOmr</code> when present.
          </p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Orders (month, excl. cancelled)" value={String(r.ordersCount)} hint="Filtered by createdAt in month" />
        <Metric title="Delivered (month)" value={String(r.deliveredCount)} hint="DELIVERED in month window" />
        <Metric title="Unpaid (month)" value={String(r.unpaidCount)} hint="Payment UNPAID, same window" />
        <Metric title="Expense total (month)" value={`${omr(r.expensesTotal)} OMR`} hint="By expenseDate, voided excluded" />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Revenue</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row label="Gross charged (totalOmr)" value={`${omr(r.revenue)} OMR`} />
            <Row label="Dessert subtotal" value={`${omr(r.dessertRevenue)} OMR`} />
            <Row label="Delivery fees (stored)" value={`${omr(r.deliveryFees)} OMR`} />
          </ul>
          <p className="mt-3 text-[11px] text-[color:var(--muted-text)]">
            Cancelled orders are excluded from revenue. Delivery fees are part of totals when persisted on orders.
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Estimated profit
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row label="Est. COGS (qty × unit cost)" value={`${omr(r.estimatedCogs)} OMR`} />
            <Row label="Est. gross profit (rev − COGS)" value={`${omr(r.estimatedGrossProfit)} OMR`} />
            <Row label="Expenses (void excluded)" value={`${omr(r.expensesTotal)} OMR`} />
            <Row label="Est. net profit (gross − expenses)" value={`${omr(r.estimatedNetProfit)} OMR`} strong />
            <Row
              label="Est. profit margin"
              value={r.marginPct != null ? `${r.marginPct}%` : "—"}
              hint="Net ÷ revenue, month window"
            />
            <Row
              label="Sum of stored line profits"
              value={`${omr(r.estimatedLineProfitSum)} OMR`}
              hint="Across items on qualifying orders"
            />
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
          <h2 className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Top products by quantity (month)
          </h2>
          <table className="w-full min-w-[340px] text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Line revenue</th>
              </tr>
            </thead>
            <tbody>
              {r.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-[color:var(--muted-text)]">
                    No linked product rows in this month&apos;s qualifying orders.
                  </td>
                </tr>
              ) : (
                r.topProducts.map((p) => (
                  <tr key={p.id} className="border-b border-[color:var(--border-soft)]/60">
                    <td className="px-3 py-2">{p.nameEn}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.qty}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{omr(p.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
          <h2 className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Expenses by category (month)
          </h2>
          <table className="w-full min-w-[260px] text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {r.expenseByCategory.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-6 text-center text-[color:var(--muted-text)]">
                    No expenses this month (void excluded).
                  </td>
                </tr>
              ) : (
                r.expenseByCategory.map((c) => (
                  <tr key={c.category} className="border-b border-[color:var(--border-soft)]/60">
                    <td className="px-3 py-2 text-xs">{c.category}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{omr(c.sum)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DailyTable title="Daily revenue (OMR)" rows={r.dailyRevenue} />
        <DailyTable title="Daily expenses (OMR)" rows={r.dailyExpenses} accent="muted" />
      </section>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Admin-only analytics. Customer menu storefront still reads static catalog data until a future DB sync phase.
      </p>
    </div>
  );
}

function Metric({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</p>
      <p className="mt-2 text-xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-[color:var(--muted-text)]">{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-[color:var(--accent-cocoa)]" : "font-semibold"}`}>{value}</span>
      {hint ? <span className="basis-full text-[11px] text-[color:var(--muted-text)]">{hint}</span> : null}
    </li>
  );
}

function DailyTable({
  title,
  rows,
  accent,
}: {
  title: string;
  rows: { day: string; amount: number }[];
  accent?: "muted";
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
      <h2 className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        {title}
      </h2>
      <table className="w-full min-w-[220px] text-left text-xs">
        <thead>
          <tr className="border-b border-[color:var(--border-soft)] text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.day}
              className={`border-b border-[color:var(--border-soft)]/60 ${accent === "muted" && row.amount === 0 ? "text-[color:var(--muted-text)]/70" : ""}`}
            >
              <td className="px-3 py-1.5 font-mono">{row.day}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{omr(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
