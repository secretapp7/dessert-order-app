import Link from "next/link";

const linkClass =
  "rounded-lg border border-[color:var(--border-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]";

export function ReportsNav({ month }: { month?: string }) {
  const q = month ? `?month=${month}` : "";
  return (
    <nav className="flex flex-wrap gap-2">
      <Link href="/admin/reports" className={linkClass}>
        Reports hub
      </Link>
      <Link href={`/admin/reports/monthly${q}`} className={linkClass}>
        Monthly
      </Link>
      <Link href={`/admin/reports/profit${q}`} className={linkClass}>
        Profit
      </Link>
      <Link href={`/admin/reports/export${q}`} className={linkClass}>
        Export CSV
      </Link>
    </nav>
  );
}

export function MonthSelector({
  month,
  prev,
  next,
  basePath,
}: {
  month: string;
  prev: string;
  next: string;
  basePath: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`${basePath}?month=${prev}`}
        className="rounded-lg border border-[color:var(--border-soft)] px-3 py-1.5 text-xs font-semibold hover:bg-[color:var(--card-cream)]"
      >
        ← {prev}
      </Link>
      <span className="rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-1.5 font-mono text-xs font-semibold text-[color:var(--card-cream)]">
        {month}
      </span>
      <Link
        href={`${basePath}?month=${next}`}
        className="rounded-lg border border-[color:var(--border-soft)] px-3 py-1.5 text-xs font-semibold hover:bg-[color:var(--card-cream)]"
      >
        {next} →
      </Link>
    </div>
  );
}

function omr(n: number) {
  return n.toFixed(3);
}

export function MetricCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{title}</p>
      <p className="mt-2 text-xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">{hint}</p> : null}
    </div>
  );
}

export { omr };
