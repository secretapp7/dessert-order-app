import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewEditForm } from "@/components/admin/reviews/review-forms";
import { getReviewById, getReviewProductOptions } from "@/lib/admin/data/review-queries";

export default async function AdminEditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [review, products] = await Promise.all([getReviewById(id), getReviewProductOptions()]);
  if (!review) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit review</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">{review.customerName}</p>
        </div>
        <Link
          href="/admin/reviews"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ReviewEditForm review={review} products={products} />
      </section>
    </div>
  );
}
