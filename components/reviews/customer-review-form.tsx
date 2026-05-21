"use client";

import { useActionState, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { StarRow } from "@/components/star-rating";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";
import { submitCustomerReviewAction, type CustomerReviewFormState } from "@/app/review/[publicId]/actions";
import { easePremium } from "@/lib/motion";

type ReadyProps = {
  publicId: string;
  token: string;
  customerName: string;
  language: AppLanguage;
  productOptions: Array<{ productId: string | null; labelEn: string; labelAr: string }>;
  defaultProductId: string | null;
};

const field =
  "mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-white px-3 py-2.5 text-sm text-[color:var(--foreground)]";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";

export function CustomerReviewForm(props: ReadyProps) {
  const { language } = props;
  const t = translations[language].orderReview;
  const reduced = useReducedMotion() ?? false;
  const [rating, setRating] = useState(5);
  const [state, formAction] = useActionState(submitCustomerReviewAction, {} satisfies CustomerReviewFormState);

  if (state && "success" in state && state.success === true) {
    return (
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-5 text-center shadow-sm"
      >
        <p className="text-[15px] font-semibold text-[color:var(--accent-cocoa)]">{t.successTitle}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--muted-text)]">{t.successBody}</p>
      </motion.div>
    );
  }

  const errKey = state?.error;
  const errMsg =
    errKey === "already_reviewed"
      ? t.alreadyReviewed
      : errKey === "invalid"
        ? t.invalidLink
        : errKey;

  const showProductSelect = props.productOptions.length > 1;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="publicId" value={props.publicId} />
      <input type="hidden" name="token" value={props.token} />
      <input type="hidden" name="rating" value={rating} />

      {errMsg ? (
        <p role="alert" className="rounded-xl border border-[color:var(--brand-burgundy-soft)]/35 bg-[color:var(--card-cream)] px-3 py-2 text-xs text-[color:var(--brand-burgundy-soft)]">
          {errMsg}
        </p>
      ) : null}

      <label className={lbl}>
        {t.nameLabel}
        <input name="customerName" required defaultValue={props.customerName} className={field} dir={language === "ar" ? "rtl" : undefined} />
      </label>

      {showProductSelect ? (
        <label className={lbl}>
          {t.productLabel}
          <select
            name="productId"
            defaultValue={props.defaultProductId ?? "general"}
            className={field}
            dir={language === "ar" ? "rtl" : undefined}
          >
            {props.productOptions.map((p) => (
              <option key={p.productId ?? "general"} value={p.productId ?? "general"}>
                {language === "ar" ? p.labelAr : p.labelEn}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="productId" value={props.defaultProductId ?? "general"} />
      )}

      <fieldset>
        <legend className={lbl}>{t.ratingLabel}</legend>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                rating === n
                  ? "border-[color:var(--brand-burgundy)] bg-[color:var(--brand-burgundy)] text-[color:var(--card-cream)]"
                  : "border-[color:var(--border-soft)] bg-white text-[color:var(--brand-burgundy)]"
              }`}
              aria-pressed={rating === n}
            >
              {n}
            </button>
          ))}
          <StarRow rating={rating} />
        </div>
      </fieldset>

      <label className={lbl}>
        {t.commentLabel}
        <textarea
          name="comment"
          required
          rows={4}
          maxLength={800}
          className={field}
          dir={language === "ar" ? "rtl" : undefined}
          placeholder={t.commentPlaceholder}
        />
      </label>

      <motion.button
        type="submit"
        whileTap={reduced ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: easePremium }}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[color:var(--brand-burgundy)] text-[13px] font-semibold text-[color:var(--card-cream)] shadow-md hover:brightness-105"
      >
        {t.submit}
      </motion.button>
    </form>
  );
}

export function CustomerReviewMessage({
  language,
  variant,
}: {
  language: AppLanguage;
  variant: "invalid" | "already_reviewed";
}) {
  const t = translations[language].orderReview;
  const title = variant === "already_reviewed" ? t.alreadyReviewedTitle : t.invalidTitle;
  const body = variant === "already_reviewed" ? t.alreadyReviewed : t.invalidBody;

  return (
    <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-5 text-center shadow-sm">
      <p className="text-[15px] font-semibold text-[color:var(--accent-cocoa)]">{title}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--muted-text)]">{body}</p>
    </div>
  );
}
