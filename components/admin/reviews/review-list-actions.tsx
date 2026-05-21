import Link from "next/link";

import {
  approveReviewQuickAction,
  featureReviewQuickAction,
  hideReviewQuickAction,
  unfeatureReviewQuickAction,
} from "@/lib/admin/actions/review-actions";
import type { ReviewListRow } from "@/lib/admin/data/review-serialize";

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, rating));
  return (
    <span className="text-[color:var(--brand-gold-muted)]" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(full)}
      <span className="text-[color:var(--border-soft)]">{"☆".repeat(5 - full)}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: ReviewListRow["status"] }) {
  const styles =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : status === "HIDDEN"
        ? "bg-stone-100 text-stone-600 border-stone-200"
        : "bg-amber-50 text-amber-900 border-amber-200";
  const label = status === "APPROVED" ? "Approved" : status === "HIDDEN" ? "Hidden" : "Pending";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles}`}>
      {label}
    </span>
  );
}

const quickBtn =
  "rounded-md border border-[color:var(--border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]";

export function ReviewListQuickActions({ review }: { review: ReviewListRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {review.status !== "APPROVED" ? (
        <form action={approveReviewQuickAction} className="inline">
          <input type="hidden" name="id" value={review.id} />
          <button type="submit" className={quickBtn}>
            Approve
          </button>
        </form>
      ) : (
        <form action={hideReviewQuickAction} className="inline">
          <input type="hidden" name="id" value={review.id} />
          <button type="submit" className={quickBtn}>
            Hide
          </button>
        </form>
      )}
      {!review.featured ? (
        <form action={featureReviewQuickAction} className="inline">
          <input type="hidden" name="id" value={review.id} />
          <button type="submit" className={quickBtn}>
            Feature
          </button>
        </form>
      ) : (
        <form action={unfeatureReviewQuickAction} className="inline">
          <input type="hidden" name="id" value={review.id} />
          <button type="submit" className={quickBtn}>
            Unfeature
          </button>
        </form>
      )}
      <Link href={`/admin/reviews/${review.id}`} className={quickBtn}>
        Edit
      </Link>
    </div>
  );
}

export function ReviewRatingStars({ rating }: { rating: number }) {
  return <Stars rating={rating} />;
}

export function ReviewStatusBadge({ status }: { status: ReviewListRow["status"] }) {
  return <StatusBadge status={status} />;
}

function previewText(text: string, max = 72) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function reviewCommentPreview(review: ReviewListRow) {
  return previewText(review.textEn);
}

export function reviewDisplayDate(review: ReviewListRow) {
  return review.reviewDateIso ?? review.createdAtIso.slice(0, 10);
}
