import Link from "next/link";

import {
  getCustomersForAdmin,
  type CustomerListFilter,
  type CustomerListSort,
} from "@/lib/admin/data/customer-queries";
import { buildCustomerChatWhatsappUrl } from "@/lib/admin/customer-whatsapp";

const PAGE_SIZE = 25;

function money(n: number) {
  return n.toFixed(3);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const filterRaw = typeof sp.filter === "string" ? sp.filter : "";
  const filter: CustomerListFilter =
    filterRaw === "repeat" ||
    filterRaw === "vip" ||
    filterRaw === "unpaid" ||
    filterRaw === "blocked"
      ? filterRaw
      : "all";

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: CustomerListSort =
    sortRaw === "orders" || sortRaw === "spent" || sortRaw === "last_order" ? sortRaw : "newest";

  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const { rows, total, pageCount } = await getCustomersForAdmin({
    q,
    filter,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });

  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (filter !== "all") baseParams.set("filter", filter);
  if (sort !== "newest") baseParams.set("sort", sort);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    const qs = next.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  function hrefWithPage(p: number) {
    const next = new URLSearchParams(baseParams);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  const sortHint =
    sort === "orders"
      ? "Most orders"
      : sort === "spent"
        ? "Highest spent"
        : sort === "last_order"
          ? "Last order date"
          : "Newest customers";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Customers</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-text)]">
          {total} customer{total === 1 ? "" : "s"} · {sortHint}
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1">
          <span className="text-[11px] font-semibold text-[color:var(--muted-text)]">Search</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, phone, email…"
            className="mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="filter" value={filter !== "all" ? filter : ""} />
        <input type="hidden" name="sort" value={sort !== "newest" ? sort : ""} />
        <button
          type="submit"
          className="rounded-lg bg-[color:var(--brand-burgundy)] px-4 py-2 text-sm font-semibold text-[color:var(--card-cream)]"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        {(
          [
            ["all", "All"],
            ["repeat", "Repeat"],
            ["vip", "VIP"],
            ["unpaid", "Has unpaid"],
            ["blocked", "Blocked"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={hrefWith({ filter: key === "all" ? undefined : key })}
            className={`rounded-full px-3 py-1 font-semibold ${
              filter === key
                ? "bg-[color:var(--brand-burgundy)] text-[color:var(--card-cream)]"
                : "border border-[color:var(--border-soft)] bg-white text-[color:var(--brand-burgundy)]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="self-center text-[color:var(--muted-text)]">Sort:</span>
        {(
          [
            ["newest", "Newest"],
            ["orders", "Most orders"],
            ["spent", "Highest spent"],
            ["last_order", "Last order"],
          ] as const
        ).map(([key, label]) => (
          <Link
            key={key}
            href={hrefWith({ sort: key === "newest" ? undefined : key })}
            className={`rounded-full px-3 py-1 font-semibold ${
              sort === key
                ? "bg-[color:var(--brand-gold-soft)] text-[color:var(--brand-burgundy)]"
                : "border border-[color:var(--border-soft)] bg-white text-[color:var(--muted-text)]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--muted-text)]">
            <tr>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Orders</th>
              <th className="px-3 py-2">Spent</th>
              <th className="px-3 py-2">Unpaid</th>
              <th className="px-3 py-2">Last order</th>
              <th className="px-3 py-2">Favorite</th>
              <th className="px-3 py-2">Reviews</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border-soft)]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[color:var(--muted-text)]">
                  No customers found yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const wa = buildCustomerChatWhatsappUrl(row.phone);
                return (
                  <tr key={row.id} className="hover:bg-[color:var(--card-cream)]/60">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/customers/${row.id}`}
                        className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-[11px] text-[color:var(--muted-text)]">{row.phone}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {row.isVip ? (
                          <span className="rounded bg-[color:var(--brand-gold-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[color:var(--brand-burgundy)]">
                            VIP
                          </span>
                        ) : null}
                        {row.isBlocked ? (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-900">
                            Blocked
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.totalOrders}</td>
                    <td className="px-3 py-2 tabular-nums">{money(row.totalSpentOmr)}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.unpaidTotalOmr > 0 ? (
                        <span className="font-semibold text-[color:var(--brand-burgundy-soft)]">
                          {money(row.unpaidTotalOmr)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-[11px]">{fmtDate(row.lastOrderDateIso)}</td>
                    <td className="max-w-[8rem] truncate px-3 py-2 text-[11px]">
                      {row.favoriteProduct ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{row.reviewCount}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          href={`/admin/customers/${row.id}`}
                          className="rounded border border-[color:var(--border-soft)] px-2 py-1 text-[10px] font-semibold"
                        >
                          View
                        </Link>
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {page > 1 ? (
            <Link href={hrefWithPage(page - 1)} className="rounded-lg border px-3 py-1 font-semibold">
              ← Prev
            </Link>
          ) : null}
          <span className="text-[color:var(--muted-text)]">
            Page {page} of {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={hrefWithPage(page + 1)} className="rounded-lg border px-3 py-1 font-semibold">
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
