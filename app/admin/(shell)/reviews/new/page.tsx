import Link from "next/link";

import { ReviewCreateForm } from "@/components/admin/reviews/review-forms";
import { getReviewProductOptions } from "@/lib/admin/data/review-queries";

export default async function AdminNewReviewPage() {
  const products = await getReviewProductOptions();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Add review</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Create a testimonial for the storefront. Only approved reviews appear publicly.
          </p>
        </div>
        <Link
          href="/admin/reviews"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ReviewCreateForm products={products} />
      </section>
    </div>
  );
}
