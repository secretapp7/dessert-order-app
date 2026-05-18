import Link from "next/link";

import { ExpenseCategory } from "@prisma/client";

import { getExpensesForAdmin, type ExpenseListFilters } from "@/lib/admin/data/expense-queries";

function money(n: unknown) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(3) : "0.000";
}

function notesPreview(notes: string | null, max = 72) {
  if (!notes?.trim()) return "—";
  const t = notes.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function parseYmdUtcStart(s: string | undefined): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 0, 0, 0, 0));
}

function parseYmdUtcEnd(s: string | undefined): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 23, 59, 59, 999));
}

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    from?: string;
    to?: string;
    sort?: string;
    void?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const catRaw = typeof sp.category === "string" ? sp.category : "";
  const category: ExpenseCategory | undefined =
    catRaw && Object.values(ExpenseCategory).includes(catRaw as ExpenseCategory)
      ? (catRaw as ExpenseCategory)
      : undefined;

  const from = parseYmdUtcStart(typeof sp.from === "string" ? sp.from : undefined);
  const to = parseYmdUtcEnd(typeof sp.to === "string" ? sp.to : undefined);

  const voidRaw = typeof sp.void === "string" ? sp.void : "";
  const voided: ExpenseListFilters["void"] =
    voidRaw === "active" || voidRaw === "voided" || voidRaw === "all" ? voidRaw : "active";

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: ExpenseListFilters["sort"] =
    sortRaw === "amount" || sortRaw === "date" || sortRaw === "updated" || sortRaw === "newest" ? sortRaw : "newest";

  const { rows, filteredTotalAmount, filteredRowCount } = await getExpensesForAdmin({
    q,
    category,
    from,
    to,
    void: voided,
    sort,
  });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (category) baseParams.set("category", category);
  if (typeof sp.from === "string" && sp.from) baseParams.set("from", sp.from);
  if (typeof sp.to === "string" && sp.to) baseParams.set("to", sp.to);
  if (voided !== "active") baseParams.set("void", voided);
  if (sort !== "newest") baseParams.set("sort", sort);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/expenses?${qs}` : "/admin/expenses";
  }

  const sortHint =
    sort === "amount"
      ? "Largest amount first"
      : sort === "date"
        ? "Expense date (newest)"
        : sort === "updated"
          ? "Recently updated"
          : "Newest created first";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Expenses</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {filteredRowCount} row{filteredRowCount === 1 ? "" : "s"} · {sortHint}
          </p>
        </div>
        <Link
          href="/admin/expenses/new"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Add expense
        </Link>
      </div>

      <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Filtered total (OMR)
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[color:var(--accent-cocoa)]">
          {money(filteredTotalAmount)} OMR
        </p>
        <p className="mt-1 text-[11px] text-[color:var(--muted-text)]">
          Matches current search, category, date range, and void filters. Choosing &quot;All&quot; includes voided rows in both
          the table and this total.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end"
      >
        <label className="min-w-[11rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search (title or notes)
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Category
          <select
            name="category"
            defaultValue={category ?? ""}
            className="mt-1 block w-full min-w-[11rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm lg:w-auto"
          >
            <option value="">Any</option>
            {Object.values(ExpenseCategory).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          From (UTC date)
          <input
            name="from"
            type="date"
            defaultValue={typeof sp.from === "string" ? sp.from : ""}
            className="mt-1 block w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          To (UTC date)
          <input
            name="to"
            type="date"
            defaultValue={typeof sp.to === "string" ? sp.to : ""}
            className="mt-1 block w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Void status
          <select
            name="void"
            defaultValue={voided}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm lg:w-auto"
          >
            <option value="active">Active (not voided)</option>
            <option value="voided">Voided only</option>
            <option value="all">All</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm lg:w-auto"
          >
            <option value="newest">Newest created</option>
            <option value="updated">Newest updated</option>
            <option value="amount">Amount (high → low)</option>
            <option value="date">Expense date</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/expenses"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Expense date</th>
              <th className="min-w-[12rem] px-3 py-2">Notes</th>
              <th className="px-3 py-2">Void</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No expenses match these filters.
                </td>
              </tr>
            ) : (
              rows.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/expenses/${e.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{e.category}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(e.amountOmr)}</td>
                  <td className="px-3 py-2 text-xs tabular-nums">{e.expenseDate.toISOString().slice(0, 10)}</td>
                  <td className="max-w-[14rem] px-3 py-2 text-xs text-[color:var(--muted-text)]" title={e.notes ?? ""}>
                    {notesPreview(e.notes)}
                  </td>
                  <td className="px-3 py-2 text-xs">{e.voidedAt ? "Voided" : "—"}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {e.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {e.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Tip: void mistakes instead of deleting whenever you want history preserved.{" "}
        <Link href={hrefWith({ void: "voided" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          View voided
        </Link>
        .
      </p>
    </div>
  );
}
