"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { ScreenEnter } from "@/components/motion/screen-enter";
import { RatingSummary } from "@/components/rating-summary";
import { ReviewCard } from "@/components/review-card";
import { ProductVisual } from "@/components/product-visual";
import { BrandLogo } from "@/components/brand-logo";
import { brand } from "@/config/brand";
import { useAppLanguage } from "@/components/language-provider";
import { getFeaturedPresentation, products } from "@/data/products";
import type { Product } from "@/data/products";
import { type ReviewProductId, getAverageRating, getFeaturedReviews, getReviewCount } from "@/data/reviews";
import {
  easePremium,
  scaleTapWhile,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";

const SIGNATURE_IDS: ReviewProductId[] = ["tiramisu", "jelly-cheesecake"];
const FEATURED_PRODUCT_ID = "tiramisu";

export default function Home() {
  const { language, t } = useAppLanguage();
  const reduced = useReducedMotion() ?? false;
  const tapScale = scaleTapWhile(reduced);

  const signatures = SIGNATURE_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is Product => p != null,
  );
  const featured = products.find((p) => p.id === FEATURED_PRODUCT_ID);
  const featuredPresentation = featured ? getFeaturedPresentation(featured) : null;

  const globalAvg = getAverageRating();
  const globalCount = getReviewCount();
  const featuredReviews = getFeaturedReviews(2);

  const pills = [
    t.home.pillPreorder,
    t.home.pillChilled,
    t.home.pillWhatsappConfirm,
  ] as const;

  const fromPrice = (p: Product) => Math.min(...p.sizes.map((s) => s.priceOmr));

  return (
    <AppShell>
      <ScreenEnter>
        <motion.div
          className="space-y-4 pb-3 pt-1"
          variants={staggerContainerVariants(reduced)}
          initial="hidden"
          animate="visible"
        >
          <div className="sr-only">
            <h1>{t.home.welcomeTitle}</h1>
          </div>

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="relative isolate z-0 -mx-3 overflow-hidden rounded-b-[1.5rem] border-b border-[color:var(--brand-gold)]/30 bg-[color:var(--background)] px-3 pb-3 pt-2.5 text-[color:var(--foreground)] shadow-[0_8px_24px_-12px_rgba(90,0,22,0.09)] ring-1 ring-[color:rgba(216,180,95,0.22)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-b before:from-[#fdf6ec] before:via-[rgba(248,234,199,0.42)] before:to-[color:var(--card-beige)]"
          >
            <div className="relative z-[1] mx-auto flex max-w-[22rem] flex-col items-center">
              <div className="relative flex w-full justify-center pb-1 pt-0.5">
                <span
                  className="pointer-events-none absolute start-1/2 top-[42%] h-[min(7.75rem,32vw)] w-[min(19rem,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-[50%] home-hero-logo-halo"
                  aria-hidden
                />
                <span className="relative z-[1] drop-shadow-[0_1px_2px_rgba(255,248,238,0.9)]">
                  <BrandLogo variant="hero" language={language} />
                </span>
              </div>
              <p className="relative z-[1] mt-1.5 px-1 text-center text-[13px] font-semibold leading-snug tracking-tight text-[color:var(--foreground)]">
                {t.home.brandTagline}
              </p>
              <p className="relative z-[1] mt-1 px-1 text-center text-[11.5px] font-medium leading-relaxed text-[color:var(--muted-text)]">
                {t.home.heroSubtitle}
              </p>
            </div>

            <div className="relative z-[1] mt-3 grid grid-cols-2 gap-2">
              <motion.div whileTap={tapScale} transition={{ duration: 0.15 }}>
                <Link
                  href="/menu"
                  className="flex min-h-11 items-center justify-center rounded-2xl border border-[color:var(--brand-burgundy)]/25 bg-[color:var(--card-cream)] text-center text-[12px] font-semibold text-[color:var(--brand-burgundy)] shadow-[0_2px_10px_-4px_rgba(90,0,22,0.18)] ring-1 ring-[color:var(--brand-gold)]/35 transition-[filter] hover:brightness-[1.03] focus-visible:outline-none active:brightness-[0.98]"
                >
                  {t.home.browseMenu}
                </Link>
              </motion.div>
              <motion.div whileTap={tapScale} transition={{ duration: 0.15 }}>
                <Link
                  href="/order"
                  className="flex min-h-11 items-center justify-center rounded-2xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--brand-burgundy)] text-center text-[12px] font-semibold text-[color:var(--card-cream)] shadow-[0_4px_14px_-4px_rgba(58,32,26,0.35)] ring-1 ring-[color:var(--brand-burgundy)]/20 transition-[filter] hover:brightness-110 focus-visible:outline-none active:brightness-[0.95]"
                >
                  {t.home.orderNow}
                </Link>
              </motion.div>
            </div>
          </motion.section>

          <motion.section variants={staggerItemVariants(reduced)}>
            <p className="mb-2 px-0.5 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-gold-muted)]">
              {t.home.signaturesTitle}
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {signatures.map((p, index) => {
                const start = fromPrice(p);
                return (
                  <motion.div
                    key={p.id}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0 : 0.08 + index * 0.05,
                      duration: reduced ? 0.12 : 0.3,
                      ease: easePremium,
                    }}
                    whileTap={tapScale}
                    className="w-[46%] min-w-[9.75rem] max-w-[11.5rem] shrink-0"
                  >
                    <Link
                      href={`/products/${p.id}`}
                      className="group relative block overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--brand-burgundy)] shadow-[0_10px_28px_-14px_rgba(74,6,20,0.3)] ring-1 ring-[color:var(--brand-gold-soft)]/30"
                    >
                      <div className="relative aspect-[4/5] w-full">
                        <ProductVisual
                          product={p}
                          language={language}
                          className="absolute inset-0 h-full w-full"
                          sizes="180px"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/12 to-transparent" />
                        <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-soft-light ds-product-card-glow" aria-hidden />
                        <div className="absolute start-2 top-2">
                          <RatingSummary
                            language={language}
                            average={getAverageRating(p.id as ReviewProductId)}
                            count={getReviewCount(p.id as ReviewProductId)}
                            reviewsWord={t.reviews.reviewsWord}
                            compact
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-2.5 text-start">
                          <p className="text-[13px] font-bold leading-tight text-white drop-shadow-sm">{p.name[language]}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-white/85">
                            {t.productCard.startingFrom} {start.toFixed(2)} {brand.currency}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {featured && featuredPresentation ? (
            <motion.section variants={staggerItemVariants(reduced)}>
              <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--brand-gold-muted)]">
                {t.home.featuredDessertLabel}
              </p>
              <motion.div whileTap={tapScale} transition={{ duration: 0.15 }}>
                <Link
                  href={`/products/${featured.id}`}
                  className="group block overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] shadow-[0_12px_32px_-18px_rgba(74,6,20,0.15)] ring-1 ring-[color:var(--brand-gold-soft)]/25 supports-[hover:hover]:hover:shadow-[0_16px_40px_-20px_rgba(74,6,20,0.2)]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[color:var(--brand-burgundy)]">
                    <ProductVisual
                      product={featured}
                      language={language}
                      className="absolute inset-0 h-full w-full"
                      sizes="(max-width: 428px) 100vw, 400px"
                      priority
                      density="hero"
                      visualSrc={featuredPresentation.src}
                      visualAlt={featuredPresentation.alt}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15" />
                    <div className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light ds-product-card-glow" aria-hidden />
                    <span className="absolute start-3 top-3 rounded-full border border-[color:var(--brand-burgundy)] bg-[color:var(--brand-gold-soft)]/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[color:var(--brand-burgundy)] shadow-sm backdrop-blur-sm ring-1 ring-[color:var(--border-soft)]">
                      {featured.badge[language]}
                    </span>
                    <div className="absolute end-3 top-3">
                      <RatingSummary
                        language={language}
                        average={getAverageRating(featured.id as ReviewProductId)}
                        count={getReviewCount(featured.id as ReviewProductId)}
                        reviewsWord={t.reviews.reviewsWord}
                        compact
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 text-start">
                      <h2 className="text-[18px] font-bold text-white drop-shadow-md">{featured.name[language]}</h2>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/90">
                        {featured.description[language]}
                      </p>
                      <span className="mt-3 inline-flex min-h-9 items-center rounded-full border border-[color:var(--brand-gold-muted)]/50 bg-[color:var(--card-cream)]/95 px-4 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--brand-burgundy)] shadow-sm">
                        {t.productCard.view}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </motion.section>
          ) : null}

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="overflow-hidden rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-3.5 text-[color:var(--foreground)] shadow-[0_10px_28px_-18px_rgba(74,6,20,0.12)] ring-1 ring-[color:var(--brand-gold-soft)]/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand-gold-muted)]">{t.offers.launchBoxTitle}</p>
                <p className="mt-1.5 max-w-[16rem] text-[12px] font-medium leading-snug text-[color:var(--muted-text)]">
                  {t.offers.launchBoxBody}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--card-beige)] text-base text-[color:var(--brand-burgundy)] shadow-inner">
                ✦
              </div>
            </div>
            <motion.div whileTap={tapScale} transition={{ duration: 0.15 }} className="mt-3">
              <Link
                href="/menu"
                className="flex min-h-10 w-full items-center justify-center rounded-xl border border-[color:var(--brand-gold)]/50 bg-[color:var(--brand-burgundy)] text-[11px] font-semibold text-[color:var(--card-cream)] shadow-md hover:brightness-105 focus-visible:outline-none active:brightness-95"
              >
                {t.offers.browseOffers}
              </Link>
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-3 shadow-[0_8px_28px_-18px_rgba(74,6,20,0.08)]"
          >
            <h2 className="text-[14px] font-bold tracking-tight text-[color:var(--foreground)]">
              {t.reviews.lovedByCustomers}
            </h2>
            {globalCount > 0 ? (
              <div className="mt-2">
                <RatingSummary
                  language={language}
                  average={globalAvg}
                  count={globalCount}
                  reviewsWord={t.reviews.reviewsWord}
                  customerRatingCaption={t.reviews.customerRatingCaption}
                />
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-[color:var(--foreground)]/65">{t.reviews.noReviewsYet}</p>
            )}
            {featuredReviews.length > 0 ? (
              <div className="mt-3 space-y-2.5">
                {featuredReviews.map((r, index) => (
                  <motion.div
                    key={r.id}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0 : index * 0.06,
                      duration: reduced ? 0.12 : 0.28,
                      ease: easePremium,
                    }}
                  >
                    <ReviewCard review={r} language={language} verifiedLabel={t.reviews.verifiedOrder} />
                  </motion.div>
                ))}
              </div>
            ) : null}
          </motion.section>

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] font-medium text-[color:var(--muted-text)]">
              {pills.map((label, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <span className="h-1 w-1 rounded-full bg-[color:var(--accent-gold)]" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </ScreenEnter>
    </AppShell>
  );
}
