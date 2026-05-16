"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductGalleryThumbnail, ProductVisual } from "@/components/product-visual";
import { RatingSummary } from "@/components/rating-summary";
import { ReviewCard } from "@/components/review-card";
import { brand } from "@/config/brand";
import { useAppLanguage } from "@/components/language-provider";
import { getProductGallerySlots, products } from "@/data/products";
import { getAverageRating, getReviewCount, getReviewsForProductDetail } from "@/data/reviews";
import {
  easePremium,
  heroRevealVariants,
  scaleTapWhile,
  slideUpBarVariants,
  subtleFadeVariants,
} from "@/lib/motion";

const MotionLink = motion.create(Link);

export default function ProductDetailPage() {
  const params = useParams<{ productId: string }>();
  return (
    <AppShell>
      <ProductDetailInner key={params.productId} productId={params.productId} />
    </AppShell>
  );
}

function ProductDetailInner({ productId }: { productId: string }) {
  const { language, t } = useAppLanguage();
  const reduced = useReducedMotion() ?? false;
  const tapScale = scaleTapWhile(reduced);
  const product = products.find((item) => item.id === productId);

  const [selectedSizeId, setSelectedSizeId] = useState(product?.sizes[0]?.id ?? "");
  const [liked, setLiked] = useState(false);
  const [activeSlot, setActiveSlot] = useState(0);

  const catalogId =
    productId === "tiramisu" || productId === "jelly-cheesecake" ? productId : null;

  const orderHref = useMemo(() => {
    if (!product) return "/order";
    const q = new URLSearchParams({ product: product.id, size: selectedSizeId });
    return `/order?${q.toString()}`;
  }, [product, selectedSizeId]);

  const slots = useMemo(() => (product ? getProductGallerySlots(product) : []), [product]);

  const avg = catalogId ? getAverageRating(catalogId) : 0;
  const reviewCount = catalogId ? getReviewCount(catalogId) : 0;
  const detailReviews =
    catalogId != null ? getReviewsForProductDetail(catalogId, 3) : [];

  if (!product) {
    return (
      <motion.div
        className="flex flex-col items-center px-2 py-10 text-center"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.12 : 0.3, ease: easePremium }}
      >
        <p className="text-[16px] font-semibold text-[color:var(--accent-cocoa)]">{t.productPage.notFoundTitle}</p>
        <p className="mt-2 max-w-xs text-[12px] leading-relaxed text-[color:var(--foreground)]/68">{t.productPage.notFoundDescription}</p>
        <MotionLink
          href="/menu"
          whileTap={tapScale}
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[color:var(--brand-burgundy)] px-6 text-[12px] font-semibold text-[color:var(--card-cream)] shadow-lg ring-1 ring-[color:var(--border-soft)]"
        >
          {t.productPage.backToMenu}
        </MotionLink>
      </motion.div>
    );
  }

  const selectedSize = product.sizes.find((s) => s.id === selectedSizeId) ?? product.sizes[0];
  const labelForCategory = t.home.categories[product.menuCategory];

  const active = slots[activeSlot] ?? slots[0];

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  }

  const backFirst = language === "ar";

  return (
    <>
      <div className="relative -mx-3 pb-36">
        <motion.div
          variants={heroRevealVariants(reduced)}
          initial="hidden"
          animate="visible"
          className="relative h-[17.5rem] overflow-hidden bg-[color:var(--brand-burgundy)] sm:h-[18.5rem]"
        >
          <ProductVisual
            key={`${product.id}-${activeSlot}`}
            product={product}
            language={language}
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 428px) 100vw, 428px"
            priority
            density="hero"
            visualSrc={active.src}
            visualAlt={active.alt}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-[color:rgba(225,189,115,0.15)]" />

          <div
            className={`relative flex items-start justify-between px-3 pt-3 ${backFirst ? "flex-row-reverse" : ""}`}
          >
            <MotionLink
              href="/menu"
              whileTap={tapScale}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-lg text-[#fff9f4] backdrop-blur-md ring-1 ring-white/15 active:bg-black/45"
              aria-label={t.productPage.backToMenu}
            >
              ‹
            </MotionLink>
            <div className={`flex gap-2 ${backFirst ? "flex-row-reverse" : ""}`}>
              <motion.button
                type="button"
                onClick={() => setLiked((v) => !v)}
                whileTap={tapScale}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-[15px] text-[#fff9f4] backdrop-blur-md ring-1 ring-white/15 active:bg-black/45"
                aria-label={t.productPage.favoriteAria}
              >
                {liked ? "♥" : "♡"}
              </motion.button>
              <motion.button
                type="button"
                onClick={onShare}
                whileTap={tapScale}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-[14px] text-[#fff9f4] backdrop-blur-md ring-1 ring-white/15 active:bg-black/45"
                aria-label={t.productPage.shareAria}
              >
                ↗
              </motion.button>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-14 start-3 end-3 flex flex-col items-start sm:bottom-16">
            <span className="rounded-full border border-white/35 bg-black/30 px-3 py-1 text-[11px] font-semibold text-[#fff2e8] backdrop-blur-md ring-1 ring-white/10">
              {labelForCategory}
            </span>
          </div>
        </motion.div>

          <div className="relative z-[2] -mt-5 flex justify-center px-4">
          <div className="-mt-10 flex gap-2 rounded-2xl border border-[color:var(--brand-gold-muted)]/45 bg-[color:var(--card-cream)]/96 px-2.5 py-2 shadow-[0_10px_28px_-16px_rgba(65,6,19,0.28)] backdrop-blur-md ring-1 ring-[color:var(--border-soft)]">
            <p className="sr-only">{t.productPage.galleryHint}</p>
            {slots.map((slot, i) => (
              <ProductGalleryThumbnail
                key={slot.id}
                slotKey={slot.id}
                product={product}
                language={language}
                src={slot.src}
                alt={slot.alt}
                active={i === activeSlot}
                onSelect={() => setActiveSlot(i)}
                reduced={reduced}
              />
            ))}
          </div>
        </div>

        <motion.div
          variants={subtleFadeVariants(reduced)}
          initial="hidden"
          animate="visible"
          className="relative -mt-1 rounded-t-3xl bg-[color:var(--card-cream)] px-3 pb-4 pt-3 shadow-[0_-12px_40px_-28px_rgba(74,6,20,0.22)] ring-1 ring-[color:var(--border-soft)]"
        >
          <div className="text-start">
            <h1 className="text-[21px] font-bold leading-tight tracking-tight text-[color:var(--foreground)]">
              {product.name[language]}
            </h1>
            {reviewCount > 0 ? (
              <div className="mt-2">
                <RatingSummary
                  language={language}
                  average={avg}
                  count={reviewCount}
                  reviewsWord={t.reviews.reviewsWord}
                  customerRatingCaption={t.reviews.customerRatingCaption}
                />
              </div>
            ) : null}
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--foreground)]/75">{product.description[language]}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[color:var(--card-beige)] px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-burgundy)] ring-1 ring-[color:var(--border-soft)]">
                {t.productPage.trustBadge}
              </span>
              <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--brand-burgundy)]/8 px-2.5 py-1 text-[10px] font-semibold text-[color:var(--brand-burgundy-soft)] ring-1 ring-[color:var(--brand-gold-muted)]/25">
                {t.productPage.preorderNote}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {product.sizes.map((size) => {
              const activeSize = size.id === selectedSizeId;
              return (
                <motion.button
                  layout
                  key={size.id}
                  type="button"
                  onClick={() => setSelectedSizeId(size.id)}
                  whileTap={tapScale}
                  transition={{ layout: { duration: reduced ? 0 : 0.22, ease: easePremium } }}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-start transition-colors ${
                    activeSize
                      ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold-soft)] ring-1 ring-[color:var(--border-soft)] shadow-[inset_0_0_0_1px_rgba(216,180,95,0.35)]"
                      : "border-[color:var(--border-soft)] bg-[color:var(--card-beige)]/80 active:bg-[color:var(--card-beige)]"
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`text-[13px] font-semibold ${activeSize ? "text-[color:var(--brand-burgundy)]" : "text-[color:var(--foreground)]"}`}
                    >
                      {size.label[language]}
                    </p>
                    <p className="text-[10px] text-[color:var(--muted-text)]">{size.serves[language]}</p>
                  </div>
                  <p className="shrink-0 text-[13px] font-bold tabular-nums text-[color:var(--brand-burgundy)]">
                    {size.priceOmr.toFixed(2)} {brand.currency}
                  </p>
                </motion.button>
              );
            })}
          </div>

          {detailReviews.length > 0 ? (
            <section className="mt-5 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <h2 className="text-[13px] font-bold tracking-tight text-[color:var(--foreground)]">
                {t.reviews.whatCustomersSay}
              </h2>
              <div className="mt-2 space-y-2.5">
                {detailReviews.map((r, index) => (
                  <motion.div
                    key={r.id}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduced ? 0 : index * 0.055,
                      duration: reduced ? 0.12 : 0.26,
                      ease: easePremium,
                    }}
                  >
                    <ReviewCard review={r} language={language} verifiedLabel={t.reviews.verifiedOrder} />
                  </motion.div>
                ))}
              </div>
            </section>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        variants={slideUpBarVariants(reduced)}
        initial="hidden"
        animate="visible"
        className="fixed left-1/2 z-[50] w-full max-w-[428px] -translate-x-1/2 border-t border-[color:var(--border-soft)] bg-[color:var(--card-cream)]/98 px-4 py-3 shadow-[0_-12px_40px_-24px_rgba(65,6,19,0.22)] backdrop-blur-lg"
        style={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">{t.productPage.total}</p>
            <p className="text-[18px] font-bold tabular-nums leading-tight text-[color:var(--brand-burgundy)]">
              {selectedSize.priceOmr.toFixed(2)} {brand.currency}
            </p>
          </div>
          <MotionLink
            href={orderHref}
            whileTap={tapScale}
            className="inline-flex min-h-12 min-w-[10rem] flex-1 items-center justify-center rounded-2xl border border-[color:var(--brand-gold-muted)]/50 bg-[color:var(--brand-burgundy)] px-4 text-[12px] font-semibold text-[color:var(--card-cream)] shadow-lg shadow-[rgba(65,6,19,0.35)] ring-1 ring-[color:var(--border-soft)] active:brightness-95"
          >
            {t.productPage.orderThisDessert}
          </MotionLink>
        </div>
      </motion.div>
    </>
  );
}
