import Link from "next/link";

import {
  ReviewListQuickActions,
  ReviewRatingStars,
  ReviewStatusBadge,
  reviewCommentPreview,
  reviewDisplayDate,
} from "@/components/admin/reviews/review-list-actions";
import {
  getReviewProductOptions,
  listReviews,
  type ReviewListFilters,
} from "@/lib/admin/data/review-queries";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    featured?: string;
    product?: string;
    rating?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;

  const statusRaw = typeof sp.status === "string" ? sp.status : "";
  const status: ReviewListFilters["status"] =
    statusRaw === "approved" || statusRaw === "pending" || statusRaw === "hidden" || statusRaw === "all"
      ? statusRaw
      : "all";

  const featuredRaw = typeof sp.featured === "string" ? sp.featured : "";
  const featured: ReviewListFilters["featured"] =
    featuredRaw === "yes" || featuredRaw === "no" || featuredRaw === "all" ? featuredRaw : "all";

  const productId = typeof sp.product === "string" ? sp.product : "all";

  const ratingRaw = typeof sp.rating === "string" ? sp.rating : "";
  const ratingNum = ratingRaw ? Number(ratingRaw) : undefined;
  const rating =
    ratingNum && Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined;

  const sortRaw = typeof sp.sort === "string" ? sp.sort : "";
  const sort: ReviewListFilters["sort"] =
    sortRaw === "oldest" ||
    sortRaw === "rating_high" ||
    sortRaw === "rating_low" ||
    sortRaw === "featured_first"
      ? sortRaw
      : "newest";

  const [reviews, products] = await Promise.all([
    listReviews({ search, status, featured, productId, rating, sort }),
    getReviewProductOptions(),
  ]);

  const baseParams = new URLSearchParams();
  if (search) baseParams.set("q", search);
  if (status !== "all") baseParams.set("status", status);
  if (featured !== "all") baseParams.set("featured", featured);
  if (productId !== "all") baseParams.set("product", productId);
  if (rating != null) baseParams.set("rating", String(rating));
  if (sort !== "newest") baseParams.set("sort", sort);

  function hrefWith(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(baseParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Reviews</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            {reviews.length} review{reviews.length === 1 ? "" : "s"} · Only approved reviews appear on the storefront
          </p>
        </div>
        <Link
          href="/admin/reviews/new"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Add review
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
      >
        <label className="min-w-[12rem] flex-1 text-xs font-semibold text-[color:var(--muted-text)]">
          Search (name or comment)
          <input
            name="q"
            type="search"
            defaultValue={search ?? ""}
            className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-1 block w-full min-w-[9rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="hidden">Hidden</option>
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
            <option value="yes">Featured</option>
            <option value="no">Not featured</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Product
          <select
            name="product"
            defaultValue={productId}
            className="mt-1 block w-full min-w-[10rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="all">All products</option>
            <option value="none">General only</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameEn}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Rating
          <select
            name="rating"
            defaultValue={rating != null ? String(rating) : ""}
            className="mt-1 block w-full min-w-[7rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="">Any</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[color:var(--muted-text)]">
          Sort
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 block w-full min-w-[11rem] rounded-xl border border-[color:var(--border-soft)] bg-white px-2 py-2 text-sm md:w-auto"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="rating_high">Rating high</option>
            <option value="rating_low">Rating low</option>
            <option value="featured_first">Featured first</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[color:var(--brand-burgundy)] px-5 py-2.5 text-sm font-semibold text-[color:var(--card-cream)] hover:brightness-110"
        >
          Apply
        </button>
        <Link
          href="/admin/reviews"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-white/80 shadow-sm">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Rating</th>
              <th className="px-3 py-2">Comment</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Featured</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center">
                  <p className="font-semibold text-[color:var(--accent-cocoa)]">No reviews yet</p>
                  <p className="mt-1 text-xs text-[color:var(--muted-text)]">
                    Add customer testimonials manually or seed from static content on first deploy.
                  </p>
                  <Link
                    href="/admin/reviews/new"
                    className="mt-3 inline-block text-xs font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline"
                  >
                    Add your first review
                  </Link>
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[color:var(--border-soft)]/70 hover:bg-[color:var(--card-cream)]/60"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="font-semibold text-[color:var(--brand-burgundy-soft)] hover:underline"
                    >
                      {r.customerName}
                    </Link>
                    {r.verifiedOrder ? (
                      <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-emerald-800">
                        Verified order
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">
                    {r.productNameEn ?? "General"}
                  </td>
                  <td className="px-3 py-2">
                    <ReviewRatingStars rating={r.rating} />
                  </td>
                  <td className="max-w-[16rem] truncate px-3 py-2 text-xs" title={r.textEn}>
                    {reviewCommentPreview(r)}
                  </td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">{r.source ?? "—"}</td>
                  <td className="px-3 py-2">
                    <ReviewStatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2 text-xs">{r.featured ? "Yes" : "—"}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--muted-text)]">{reviewDisplayDate(r)}</td>
                  <td className="px-3 py-2">
                    <ReviewListQuickActions review={r} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--muted-text)]">
        Quick:{" "}
        <Link href={hrefWith({ status: "pending" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Pending
        </Link>
        {" · "}
        <Link href={hrefWith({ featured: "yes" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Featured
        </Link>
        {" · "}
        <Link href={hrefWith({ status: "approved" })} className="font-semibold text-[color:var(--brand-burgundy-soft)] underline-offset-2 hover:underline">
          Approved
        </Link>
      </p>
    </div>
  );
}
