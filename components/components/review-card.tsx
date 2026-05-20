"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Review } from "@/data/reviews";
import type { AppLanguage } from "@/config/translations";
import { StarRow } from "@/components/star-rating";
import { easePremium } from "@/lib/motion";

type ReviewCardProps = {
  review: Review;
  language: AppLanguage;
  verifiedLabel: string;
};

export function ReviewCard({ review, language, verifiedLabel }: ReviewCardProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <article className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-3 shadow-[0_6px_20px_-14px_rgba(65,6,19,0.14)] ring-1 ring-[color:rgba(225,189,115,0.12)]">
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--brand-burgundy-soft)] to-[color:var(--brand-burgundy)] text-[11px] font-bold text-[color:var(--card-cream)] shadow-inner ring-1 ring-[color:var(--border-soft)]"
          aria-hidden
        >
          {review.customerInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-[13px] font-semibold text-[color:var(--accent-cocoa)]">{review.customerName}</p>
            {review.verifiedOrder ? (
              <motion.span
                initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0.12 : 0.2, ease: easePremium }}
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[color:var(--brand-burgundy)]"
              >
                {verifiedLabel}
              </motion.span>
            ) : null}
          </div>
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0.12 : 0.22, ease: easePremium, delay: reduced ? 0 : 0.05 }}
            className="mt-1 flex items-center gap-2"
          >
            <StarRow rating={review.rating} />
            <span className="text-[9px] font-medium text-[color:var(--foreground)]/55">{review.dateLabel[language]}</span>
          </motion.div>
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--foreground)]/78">{review.text[language]}</p>
        </div>
      </div>
    </article>
  );
}
