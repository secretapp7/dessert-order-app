import Link from "next/link";

import { ReportsNav } from "@/components/admin/reports/report-chrome";
import { getCustomerReportInsights } from "@/lib/admin/data/customer-queries";
import { getMonthlyBusinessReport } from "@/lib/admin/data/monthly-report-queries";
import { utcCurrentMonthLabel } from "@/lib/admin/data/report-queries";

export default async function AdminReportsHubPage() {
  const month = utcCurrentMonthLabel();
  const [report, customerInsights] = await Promise.all([
    getMonthlyBusinessReport(month),
    getCustomerReportInsights(5),
  ]);
  const s = report.summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Reports</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-text)]">
          Income, expenses, profit, and CSV exports from live PostgreSQL data (UTC).
        </p>
      </div>

      <ReportsNav month={month} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <HubCard title="Monthly report" href={`/admin/reports/monthly?month=${month}`} body="Full month breakdown, trends, best sellers." />
        <HubCard title="Profit report" href={`/admin/reports/profit?month=${month}`} body="Revenue, COGS estimates, margins." />
        <HubCard title="Export CSV" href={`/admin/reports/export?month=${month}`} body="Download orders, items, expenses, profit." />
        <HubCard title="Expenses" href="/admin/expenses" body="Manage and void expense entries." />
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Current month snapshot ({month})
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Mini title="Gross income" value={`${s.grossIncome.toFixed(3)} OMR`} />
          <Mini title="Expenses" value={`${s.expenses.toFixed(3)} OMR`} />
          <Mini title="Net profit" value={`${s.netProfit.toFixed(3)} OMR`} />
          <Mini title="Unpaid receivables" value={`${s.unpaidTotal.toFixed(3)} OMR`} />
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
            Customer insights
          </h2>
          <Link
            href="/admin/customers"
            className="text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
          >
            Open CRM
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <InsightList title="Top by spending" rows={customerInsights.topBySpending.map((r) => ({
            id: r.id,
            label: r.name,
            detail: `${r.spentOmr.toFixed(3)} OMR · ${r.orderCount} orders`,
          }))} />
          <InsightList title="Top repeat customers" rows={customerInsights.topRepeat.map((r) => ({
            id: r.id,
            label: r.name,
            detail: `${r.orderCount} orders · ${r.spentOmr.toFixed(3)} OMR`,
          }))} />
          <InsightList title="Unpaid balances" rows={customerInsights.unpaidCustomers.map((r) => ({
            id: r.id,
            label: r.name,
            detail: `${r.unpaidOmr.toFixed(3)} OMR unpaid`,
          }))} />
        </div>
      </section>
    </div>
  );
}

function InsightList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; label: string; detail: string }>;
}) {
  return (
    <div className="rounded-xl bg-[color:var(--card-cream)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-[color:var(--muted-text)]">No data yet.</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/customers/${r.id}`} className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline">
                {r.label}
              </Link>
              <p className="text-[11px] text-[color:var(--muted-text)]">{r.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HubCard({ title, href, body }: { title: string; href: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm hover:bg-[color:var(--card-cream)]"
    >
      <p className="font-semibold text-[color:var(--brand-burgundy-soft)]">{title}</p>
      <p className="mt-1 text-xs text-[color:var(--muted-text)]">{body}</p>
    </Link>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--card-cream)] px-3 py-2">
      <p className="text-[10px] uppercase text-[color:var(--muted-text)]">{title}</p>
      <p className="mt-1 font-bold tabular-nums">{value}</p>
    </div>
  );
}
