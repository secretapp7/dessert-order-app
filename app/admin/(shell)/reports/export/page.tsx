import Link from "next/link";

import { MonthSelector, ReportsNav } from "@/components/admin/reports/report-chrome";
import { monthNavLabels, utcCurrentMonthLabel } from "@/lib/admin/data/report-queries";
import { parseReportMonthParam } from "@/lib/admin/validation/report-export";

const exports = [
  { type: "orders", label: "Orders CSV", href: (m: string) => `/admin/reports/export/orders?month=${m}` },
  { type: "order-items", label: "Order items CSV", href: (m: string) => `/admin/reports/export/order-items?month=${m}` },
  { type: "expenses", label: "Expenses CSV", href: (m: string) => `/admin/reports/export/expenses?month=${m}` },
  { type: "profit", label: "Profit summary CSV", href: (m: string) => `/admin/reports/export/profit?month=${m}` },
  { type: "products", label: "Product sales CSV", href: (m: string) => `/admin/reports/export/products?month=${m}` },
] as const;

export default async function AdminExportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const sp = await searchParams;
  const month = parseReportMonthParam(sp.month) ?? utcCurrentMonthLabel();
  const nav = monthNavLabels(month);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Export CSV</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Admin-only downloads with UTF-8 BOM for Excel Arabic support.
          </p>
        </div>
        <MonthSelector month={nav.current} prev={nav.prev} next={nav.next} basePath="/admin/reports/export" />
      </div>

      <ReportsNav month={month} />

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 text-sm text-[color:var(--muted-text)]">
        <ul className="list-inside list-disc space-y-1 text-xs">
          <li>Cancelled orders are excluded from income/profit exports (order items & product sales).</li>
          <li>Archived orders are included in order exports.</li>
          <li>Voided expenses are excluded from profit calculations; expense CSV includes void columns.</li>
          <li>Unpaid order totals appear in profit summary as receivables.</li>
        </ul>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {exports.map((e) => (
          <Link
            key={e.type}
            href={e.href(month)}
            className="flex min-h-14 items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-white/80 px-4 py-3 text-sm font-semibold text-[color:var(--brand-burgundy)] shadow-sm hover:bg-[color:var(--card-cream)]"
          >
            Download {e.label}
          </Link>
        ))}
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Files named <span className="font-mono">coco-treats-*-{month}.csv</span>
      </p>
    </div>
  );
}
