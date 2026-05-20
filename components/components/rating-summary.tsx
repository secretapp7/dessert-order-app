import type { AppLanguage } from "@/config/translations";
import { formatRatingValue, formatReviewCount } from "@/components/review-format";
import { StarBar } from "@/components/star-rating";

type RatingSummaryProps = {
  language: AppLanguage;
  average: number;
  count: number;
  reviewsWord: string;
  customerRatingCaption?: string;
  compact?: boolean;
};

export function RatingSummary({
  language,
  average,
  count,
  reviewsWord,
  customerRatingCaption,
  compact,
}: RatingSummaryProps) {
  if (count === 0) {
    return null;
  }

  const display = formatRatingValue(language, average);
  const countStr = formatReviewCount(language, count);

  if (compact) {
    return (
      <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--card-cream)]/95 px-2 py-0.5 text-[9px] font-semibold text-[color:var(--brand-burgundy)] shadow-sm backdrop-blur-sm ring-1 ring-[color:var(--brand-gold-soft)]/40">
        <span className="text-[color:var(--brand-gold)]" aria-hidden>
          ★
        </span>
        <span className="tabular-nums">{display}</span>
        <span className="text-[color:var(--muted-text)]/55">·</span>
        <span className="min-w-0 truncate text-[color:var(--muted-text)]">
          {countStr} {reviewsWord}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {customerRatingCaption ? (
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand-gold-muted)]">
          {customerRatingCaption}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums leading-none text-[color:var(--foreground)]">
            {display}
          </span>
          <StarBar rating={average} className="translate-y-px text-[11px]" />
        </div>
        <p className="text-[10px] font-medium text-[color:var(--muted-text)]">
          {countStr} {reviewsWord}
        </p>
      </div>
    </div>
  );
}
