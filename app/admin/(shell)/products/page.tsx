import Link from "next/link";

import { ProductStatus } from "@prisma/client";

import { getProductsForAdmin } from "@/lib/admin/data/catalog-queries";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const status =
    statusRaw && Object.values(ProductStatus).includes(statusRaw as ProductStatus)
      ? (statusRaw as ProductStatus)
      : undefined;

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: "updated" | "created" | "sortOrder" =
    sortRaw === "sortOrder" || sortRaw === "created" || sortRaw === "updated"
      ? sortRaw
      : "updated";

  const products = await getProductsForAdmin({ q, status, sort });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (status) baseParams.set("status", status);
  if (sort && sort !== "updated") baseParams.set("sort", sort);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  const sortHint =
    sort === "sortOrder" ? "Sort order, then newest update" : sort === "created" ? "Newest created first" : "Newest update first";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Products</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {products.length} product{products.length === 1 ? "" : "s"} · {sortHint}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Add product
        </Link>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search (name or slug)
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="">Any</option>
            {Object.values(ProductStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="updated">Newest updated</option>
            <option value="created">Newest created</option>
            <option value="sortOrder">Manual sort order</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/products"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Name (EN)</th>
              <th className="px-3 py-2">Name (AR)</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Feat.</th>
              <th className="px-3 py-2 text-right">Sort</th>
              <th className="px-3 py-2 text-right">Sizes</th>
              <th className="px-3 py-2 text-right">Images</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No products match these filters.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {p.nameEn}
                    </Link>
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2" dir="rtl" title={p.nameAr}>
                    {p.nameAr}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{p.slug}</td>
                  <td className="px-3 py-2 text-xs">
                    {p.category ? (
                      <Link
                        href={`/admin/categories/${p.category.id}`}
                        className="text-[color:var(--brand-burgundy-soft)] hover:underline"
                      >
                        {p.category.nameEn}
                      </Link>
                    ) : (
                      <span className="text-[color:var(--muted-text)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{p.status}</td>
                  <td className="px-3 py-2 text-xs">{p.featured ? "Yes" : "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.sortOrder}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p._count.sizes}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p._count.images}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {p.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {p.updatedAt.toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Quick:{" "}
        <Link href={hrefWith({ status: "ACTIVE" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Active
        </Link>
        {" · "}
        <Link href={hrefWith({ status: "SOLD_OUT" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Sold out
        </Link>
        {" · "}
        <Link href={hrefWith({ status: "HIDDEN" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Hidden
        </Link>
      </p>
    </div>
  );
}
