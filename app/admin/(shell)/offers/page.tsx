import Link from "next/link";

import { getOffersForAdmin, type OfferListFilters } from "@/lib/admin/data/offer-queries";

function money(n: unknown) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(3) : "0.000";
}

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; active?: string; featured?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const activeRaw = typeof sp.active === "string" ? sp.active : "";
  const active: OfferListFilters["active"] =
    activeRaw === "yes" || activeRaw === "no" || activeRaw === "all" ? activeRaw : "all";

  const featuredRaw = typeof sp.featured === "string" ? sp.featured : "";
  const featured: OfferListFilters["featured"] =
    featuredRaw === "yes" || featuredRaw === "no" || featuredRaw === "all" ? featuredRaw : "all";

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: OfferListFilters["sort"] =
    sortRaw === "created" || sortRaw === "start" || sortRaw === "updated" ? sortRaw : "updated";

  const offers = await getOffersForAdmin({ q, active, featured, sort });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (active !== "all") baseParams.set("active", active);
  if (featured !== "all") baseParams.set("featured", featured);
  if (sort !== "updated") baseParams.set("sort", sort);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/offers?${qs}` : "/admin/offers";
  }

  const sortHint =
    sort === "created"
      ? "Newest created first"
      : sort === "start"
        ? "Soonest start (nulls last ordering by Prisma asc)"
        : "Newest updated first";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Offers</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {offers.length} offer{offers.length === 1 ? "" : "s"} · {sortHint}
          </p>
        </div>
        <Link
          href="/admin/offers/new"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Add offer
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
      >
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search (title or slug)
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
            defaultValue={active}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="all">All</option>
            <option value="yes">Active only</option>
            <option value="no">Inactive only</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Featured
          <select
            name="featured"
            defaultValue={featured}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="all">All</option>
            <option value="yes">Featured only</option>
            <option value="no">Not featured</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 block w-full min-w-[11rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="updated">Newest updated</option>
            <option value="created">Newest created</option>
            <option value="start">Start date</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/offers"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Title (EN)</th>
              <th className="px-3 py-2">Title (AR)</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Feat.</th>
              <th className="px-3 py-2">Starts</th>
              <th className="px-3 py-2">Ends</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No offers match these filters.
                </td>
              </tr>
            ) : (
              offers.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/offers/${o.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {o.titleEn}
                    </Link>
                  </td>
                  <td className="max-w-[12rem] truncate px-3 py-2" dir="rtl" title={o.titleAr}>
                    {o.titleAr}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{o.slug}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(o.priceOmr)} OMR</td>
                  <td className="px-3 py-2 text-xs">{o.isActive ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-xs">{o.featuredOnHome ? "Yes" : "—"}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {o.startsAt ? o.startsAt.toISOString().slice(0, 19).replace("T", " ") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {o.endsAt ? o.endsAt.toISOString().slice(0, 19).replace("T", " ") : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {o.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {o.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Quick:{" "}
        <Link
          href={hrefWith({ active: "yes" })}
          className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          Active
        </Link>
        {" · "}
        <Link
          href={hrefWith({ featured: "yes" })}
          className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
        >
          Featured
        </Link>
      </p>
    </div>
  );
}
