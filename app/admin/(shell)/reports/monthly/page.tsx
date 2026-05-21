import Link from "next/link";

import { MetricCard, MonthSelector, ReportsNav, omr } from "@/components/admin/reports/report-chrome";
import { getMonthlyBusinessReport } from "@/lib/admin/data/monthly-report-queries";
import { monthNavLabels, utcCurrentMonthLabel } from "@/lib/admin/data/report-queries";
import { parseReportMonthParam } from "@/lib/admin/validation/report-export";

export default async function AdminMonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = parseReportMonthParam(sp.month) ?? utcCurrentMonthLabel();
  const nav = monthNavLabels(month);
  const r = await getMonthlyBusinessReport(month);
  const s = r.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Monthly report</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            UTC month <span className="font-mono">{r.monthLabel}</span>. Cancelled orders excluded from income; archived
            orders included. Voided expenses excluded.
          </p>
        </div>
        <MonthSelector month={nav.current} prev={nav.prev} next={nav.next} basePath="/admin/reports/monthly" />
      </div>

      <ReportsNav month={month} />

      {s.suspiciousZeroCost ? (
        <div className="rounded-2xl border border-amber-800/35 bg-[color:var(--card-cream)] px-4 py-3 text-sm text-amber-950">
          Some line items have zero estimated unit cost — product profit figures are approximate.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total orders" value={String(s.orderCount)} />
        <MetricCard title="Delivered" value={String(r.deliveredCount)} />
        <MetricCard title="Cancelled" value={String(s.cancelledCount)} />
        <MetricCard title="Gross income" value={`${omr(s.grossIncome)} OMR`} />
        <MetricCard title="Avg order value" value={`${omr(s.averageOrderValue)} OMR`} />
        <MetricCard title="Dessert income" value={`${omr(s.dessertIncome)} OMR`} />
        <MetricCard title="Delivery fees" value={`${omr(s.deliveryFeeIncome)} OMR`} />
        <MetricCard title="Expenses" value={`${omr(s.expenses)} OMR`} />
        <MetricCard title="Net profit" value={`${omr(s.netProfit)} OMR`} hint="Gross income − expenses" />
        <MetricCard
          title="Est. net profit"
          value={`${omr(s.estimatedNetProfit)} OMR`}
          hint="After estimated COGS"
        />
        <MetricCard title="Unpaid total" value={`${omr(s.unpaidTotal)} OMR`} hint={`${s.unpaidCount} orders`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TableSection title="Product sales">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2">Size</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="px-2 py-2 text-right">Revenue</th>
                <th className="px-2 py-2 text-right">Est. profit</th>
              </tr>
            </thead>
            <tbody>
              {r.productSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-[color:var(--muted-text)]">
                    No qualifying sales this month.
                  </td>
                </tr>
              ) : (
                r.productSales.slice(0, 20).map((p) => (
                  <tr key={`${p.productNameEn}-${p.sizeLabelEn}`} className="border-b border-[color:var(--border-soft)]/60">
                    <td className="px-2 py-1.5">{p.productNameEn}</td>
                    <td className="px-2 py-1.5 text-xs">{p.sizeLabelEn}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{p.quantitySold}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{omr(p.revenue)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{omr(p.estimatedProfit)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableSection>

        <TableSection title="Expenses by category">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2 text-right">Count</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {r.expenseByCategory.map((c) => (
                <tr key={c.category} className="border-b border-[color:var(--border-soft)]/60">
                  <td className="px-2 py-1.5 text-xs">{c.category}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{c.count}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{omr(c.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableSection>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <MiniTable title="Order status" rows={r.orderStatus.map((x) => [x.status, String(x.count)])} />
        <MiniTable title="Payment status" rows={r.payment.map((x) => [x.paymentStatus, `${x.count} · ${omr(x.totalOmr)}`])} />
        <MiniTable title="Fulfillment" rows={r.fulfillment.map((x) => [x.fulfillmentMethod, String(x.count)])} />
      </section>

      {(r.bestByQty || r.bestByRevenue) && (
        <section className="grid gap-3 sm:grid-cols-2">
          {r.bestByQty ? (
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
              <p className="text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">Top by quantity</p>
              <p className="mt-2 font-semibold">
                {r.bestByQty.productNameEn} ({r.bestByQty.sizeLabelEn}) ×{r.bestByQty.quantitySold}
              </p>
            </div>
          ) : null}
          {r.bestByRevenue ? (
            <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4">
              <p className="text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">Top by revenue</p>
              <p className="mt-2 font-semibold">
                {r.bestByRevenue.productNameEn} — {omr(r.bestByRevenue.revenue)} OMR
              </p>
            </div>
          ) : null}
        </section>
      )}

      <TableSection title="Daily trend">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead>
            <tr className="border-b text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2 text-right">Orders</th>
              <th className="px-2 py-2 text-right">Income</th>
              <th className="px-2 py-2 text-right">Expenses</th>
              <th className="px-2 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {r.dailyTrend.map((d) => (
              <tr key={d.dateYmd} className="border-b border-[color:var(--border-soft)]/60">
                <td className="px-2 py-1 font-mono">{d.dateYmd}</td>
                <td className="px-2 py-1 text-right tabular-nums">{d.orders}</td>
                <td className="px-2 py-1 text-right tabular-nums">{omr(d.income)}</td>
                <td className="px-2 py-1 text-right tabular-nums">{omr(d.expenses)}</td>
                <td className="px-2 py-1 text-right tabular-nums">{omr(d.netProfit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableSection>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        <Link href={`/admin/reports/export?month=${month}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Download CSV exports
        </Link>{" "}
        for this month.
      </p>
    </div>
  );
}

function TableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
      <h2 className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function MiniTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase text-[color:var(--brand-gold-muted)]">{title}</p>
      <ul className="mt-2 space-y-1 text-xs">
        {rows.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-2">
            <span>{k}</span>
            <span className="font-semibold tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
