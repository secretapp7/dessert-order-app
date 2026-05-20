"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Product } from "@/data/products";
import type { StorefrontProductStatus } from "@/lib/storefront/types";
import { brand } from "@/config/brand";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";
import { ProductVisual } from "@/components/product-visual";
import { RatingSummary } from "@/components/rating-summary";
import type { ReviewProductId } from "@/data/reviews";
import { getAverageRating, getReviewCount } from "@/data/reviews";
import {
  cardHoverWhile,
  easePremium,
  scaleTapWhile,
  staggerItemVariants,
} from "@/lib/motion";

type ProductCardProps = {
  product: Product & { status?: StorefrontProductStatus };
  language: AppLanguage;
};

export function ProductCard({ product, language }: ProductCardProps) {
  const t = translations[language];
  const reduced = useReducedMotion() ?? false;
  const soldOut = product.status === "SOLD_OUT";
  const startingPrice = Math.min(...product.sizes.map((size) => size.priceOmr));
  const pid = product.id as ReviewProductId;
  const avg = getAverageRating(pid);
  const count = getReviewCount(pid);

  const hoverLift = cardHoverWhile(reduced);
  const tapScale = scaleTapWhile(reduced);

  return (
    <motion.div
      variants={staggerItemVariants(reduced)}
      whileHover={hoverLift ? hoverLift : undefined}
      whileTap={tapScale}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link
        href={`/products/${product.id}`}
        className="group block h-full overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] shadow-[0_10px_28px_-18px_rgba(74,6,20,0.12)] outline-none ring-0 transition-[box-shadow] supports-[hover:hover]:hover:shadow-[0_14px_36px_-20px_rgba(74,6,20,0.16)] supports-[hover:hover]:hover:ring-1 supports-[hover:hover]:hover:ring-[color:var(--brand-gold-soft)]/45"
        aria-labelledby={`product-title-${product.id}`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[color:var(--brand-burgundy)]">
          <ProductVisual
            product={product}
            language={language}
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 428px) 100vw, 400px"
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <div
            className="pointer-events-none absolute inset-0 z-[2] opacity-[0.22] mix-blend-soft-light ds-product-card-glow"
            aria-hidden
          />
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0.12 : 0.24, ease: easePremium }}
            className={`absolute start-2.5 top-2.5 z-[3] inline-flex rounded-full border-2 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm ring-1 ring-[color:var(--border-soft)] backdrop-blur-sm ${
              soldOut
                ? "border-white/40 bg-black/55 text-white"
                : "border-[color:var(--brand-burgundy)] bg-[color:var(--brand-gold-soft)]/92 text-[color:var(--brand-burgundy)]"
            }`}
          >
            {soldOut ? t.productCard.soldOut : product.badge[language]}
          </motion.span>
          {count > 0 ? (
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.26, ease: easePremium, delay: reduced ? 0 : 0.05 }}
              className="absolute bottom-2.5 start-2.5 end-2.5 z-[3] flex flex-wrap items-end justify-between gap-1"
            >
              <RatingSummary
                language={language}
                average={avg}
                count={count}
                reviewsWord={t.reviews.reviewsWord}
                compact
              />
            </motion.div>
          ) : null}
        </div>

        <div className="space-y-2 px-3 pb-3 pt-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3
              id={`product-title-${product.id}`}
              className="min-w-0 flex-1 text-[16px] font-semibold leading-tight tracking-tight text-[color:var(--foreground)]"
            >
              {product.name[language]}
            </h3>
          </div>
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[color:var(--muted-text)]">{product.description[language]}</p>
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <p className="text-[13px] leading-none">
              <span className="text-[10px] font-medium text-[color:var(--brand-gold-muted)]">{t.productCard.startingFrom}</span>{" "}
              <span className="font-bold tabular-nums text-[color:var(--brand-burgundy)]">
                {startingPrice.toFixed(2)} {brand.currency}
              </span>
            </p>
            <span
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-wide shadow-sm ${
                soldOut
                  ? "border-[color:var(--border-soft)] bg-[color:var(--card-beige)] text-[color:var(--muted-text)]"
                  : "border-[color:var(--brand-gold-muted)]/40 bg-[color:var(--brand-burgundy)] text-[color:var(--card-cream)] supports-[hover:hover]:group-hover:brightness-110"
              }`}
            >
              {soldOut ? t.productCard.soldOut : t.productCard.view}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
