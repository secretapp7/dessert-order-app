import Link from "next/link";

import { getCategoriesForAdmin } from "@/lib/admin/data/catalog-queries";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; active?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const activeRaw = typeof sp.active === "string" ? sp.active : "";
  const active: "yes" | "no" | "all" =
    activeRaw === "yes" || activeRaw === "no" ? activeRaw : "all";

  const rows = await getCategoriesForAdmin({ q, active: active === "all" ? undefined : active });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (active !== "all") baseParams.set("active", active);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/categories?${qs}` : "/admin/categories";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Categories</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {rows.length} categor{rows.length === 1 ? "y" : "ies"} · product counts are live
          </p>
        </div>
        <Link
          href="/admin/categories/new"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Add category
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Active
          <select
            name="active"
            defaultValue={active === "all" ? "" : active}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="">Any</option>
            <option value="yes">Active only</option>
            <option value="no">Inactive only</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/categories"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Name (EN)</th>
              <th className="px-3 py-2">Name (AR)</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2 text-right">Sort</th>
              <th className="px-3 py-2 text-right">Products</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No categories match these filters.
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {c.nameEn}
                    </Link>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2" dir="rtl" title={c.nameAr}>
                    {c.nameAr}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{c.slug}</td>
                  <td className="px-3 py-2 text-xs">{c.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.sortOrder}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c._count.products}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        <Link href={hrefWith({ active: "yes" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Active only
        </Link>
        {" · "}
        <Link href={hrefWith({ active: "no" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Inactive
        </Link>
      </p>
    </div>
  );
}
