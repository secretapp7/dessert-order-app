import Link from "next/link";

import { MetricCard, MonthSelector, ReportsNav, omr } from "@/components/admin/reports/report-chrome";
import { getProfitReportUtcMonth } from "@/lib/admin/data/profit-queries";
import { monthNavLabels, utcCurrentMonthLabel } from "@/lib/admin/data/report-queries";
import { parseReportMonthParam } from "@/lib/admin/validation/report-export";

export default async function AdminProfitReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = parseReportMonthParam(sp.month) ?? utcCurrentMonthLabel();
  const nav = monthNavLabels(month);
  const r = await getProfitReportUtcMonth(month);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Profit report</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            UTC month <span className="font-mono">{r.monthLabel}</span>. Revenue from stored order totals; cancelled
            excluded; archived included.
          </p>
        </div>
        <MonthSelector month={nav.current} prev={nav.prev} next={nav.next} basePath="/admin/reports/profit" />
      </div>

      <ReportsNav month={month} />

      {(r.suspiciousZeroCost || r.estimatedCogs === 0) && (
        <div className="rounded-2xl border border-amber-800/35 bg-[color:var(--card-cream)] px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Cost data notice</p>
          <p className="mt-1 text-[13px] text-[color:var(--muted-text)]">
            COGS uses <code className="text-xs">OrderItem.estimatedUnitCostOmr</code>; profit is estimated when costs
            are missing on older rows.
          </p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Orders (excl. cancelled)" value={String(r.ordersCount)} />
        <MetricCard title="Delivered" value={String(r.deliveredCount)} />
        <MetricCard title="Unpaid orders" value={String(r.unpaidCount)} />
        <MetricCard title="Unpaid total" value={`${omr(r.unpaidTotal)} OMR`} />
        <MetricCard title="Expense total" value={`${omr(r.expensesTotal)} OMR`} hint="Void excluded" />
        <MetricCard title="Net profit" value={`${omr(r.netProfit)} OMR`} hint="Income − expenses" />
        <MetricCard title="Est. net profit" value={`${omr(r.estimatedNetProfit)} OMR`} hint="After COGS" />
        <MetricCard title="Avg order value" value={`${omr(r.averageOrderValue)} OMR`} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">Revenue</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row label="Gross charged (totalOmr)" value={`${omr(r.revenue)} OMR`} />
            <Row label="Dessert subtotal" value={`${omr(r.dessertRevenue)} OMR`} />
            <Row label="Delivery fees" value={`${omr(r.deliveryFees)} OMR`} />
          </ul>
        </div>
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Estimated profit
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row label="Est. COGS" value={`${omr(r.estimatedCogs)} OMR`} />
            <Row label="Est. gross (rev − COGS)" value={`${omr(r.estimatedGrossProfit)} OMR`} />
            <Row label="Expenses" value={`${omr(r.expensesTotal)} OMR`} />
            <Row label="Est. net profit" value={`${omr(r.estimatedNetProfit)} OMR`} strong />
            <Row label="Margin" value={r.marginPct != null ? `${r.marginPct}%` : "—"} />
            <Row label="Sum line profits" value={`${omr(r.estimatedLineProfitSum)} OMR`} />
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Table title="Top products (qty)">
          <thead>
            <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">Est. profit</th>
            </tr>
          </thead>
          <tbody>
            {r.topProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[color:var(--muted-text)]">
                  No sales this month.
                </td>
              </tr>
            ) : (
              r.topProducts.map((p) => (
                <tr key={p.id} className="border-b border-[color:var(--border-soft)]/60">
                  <td className="px-3 py-2">{p.nameEn}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{omr(p.revenue)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{omr(p.estimatedProfit)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <Table title="Expenses by category">
          <thead>
            <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right">Count</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {r.expenseByCategory.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[color:var(--muted-text)]">
                  No expenses this month.
                </td>
              </tr>
            ) : (
              r.expenseByCategory.map((c) => (
                <tr key={c.category} className="border-b border-[color:var(--border-soft)]/60">
                  <td className="px-3 py-2 text-xs">{c.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{omr(c.sum)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DailyTable title="Daily revenue (OMR)" rows={r.dailyRevenue} />
        <DailyTable title="Daily expenses (OMR)" rows={r.dailyExpenses} accent="muted" />
      </section>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        See also{" "}
        <Link href={`/admin/reports/monthly?month=${month}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          full monthly report
        </Link>{" "}
        and{" "}
        <Link href={`/admin/reports/export?month=${month}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          CSV export
        </Link>
        .
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2">
      <span className="text-[color:var(--muted-text)]">{label}</span>
      <span className={`tabular-nums ${strong ? "font-bold text-[color:var(--accent-cocoa)]" : "font-semibold"}`}>{value}</span>
    </li>
  );
}

function Table({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
      <h2 className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        {title}
      </h2>
      <table className="w-full min-w-[340px] text-left text-sm">{children}</table>
    </div>
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
          <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
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
