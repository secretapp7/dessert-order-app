"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import type { LocalizedText, Product } from "@/data/products";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";
import { easePremium, scaleTapWhile } from "@/lib/motion";

export type ProductVisualDensity = "hero" | "card" | "compact";

function ProductImageFallback({
  product,
  language,
  density,
}: {
  product: Product;
  language: AppLanguage;
  density: ProductVisualDensity;
}) {
  const comingSoon = translations[language].productPage.photoComingSoon;

  const initialsClass =
    density === "hero"
      ? "text-4xl font-black tracking-tight sm:text-5xl"
      : density === "card"
        ? "text-3xl font-black tracking-tight sm:text-4xl"
        : "text-xl font-black tracking-tight";

  const labelClass =
    density === "compact"
      ? "mt-1 max-w-[95%] px-1 text-center text-[7px] font-semibold uppercase tracking-wide text-white/88"
      : "mt-2 max-w-[92%] px-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90";

  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${product.visualGradient} opacity-[0.96] ds-visual-fallback-shimmer`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.38),transparent_58%)]" />
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/18 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-black/12 blur-xl" />
      <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center px-1">
        <span className={`text-white/95 drop-shadow-md ${initialsClass}`}>{product.fallbackInitials}</span>
        <span className={labelClass}>{comingSoon}</span>
      </div>
    </>
  );
}

type ProductVisualTrackProps = {
  product: Product;
  language: AppLanguage;
  primary: string;
  alt: LocalizedText;
  className: string;
  sizes: string;
  priority: boolean;
  ariaHidden?: boolean;
  density: ProductVisualDensity;
};

function ProductVisualTrack({
  product,
  language,
  primary,
  alt,
  className,
  sizes,
  priority,
  ariaHidden,
  density,
}: ProductVisualTrackProps) {
  const [broken, setBroken] = useState(false);

  if (!primary || broken) {
    return (
      <div
        className={`relative overflow-hidden rounded-[inherit] bg-[color:var(--brand-burgundy-soft)] ${className}`}
        aria-hidden={ariaHidden}
      >
        <ProductImageFallback product={product} language={language} density={density} />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[inherit] bg-[color:var(--brand-burgundy)] ${className}`}>
      <Image
        src={primary}
        alt={alt[language]}
        fill
        className="object-cover"
        sizes={sizes}
        priority={priority}
        onError={() => setBroken(true)}
        aria-hidden={ariaHidden}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
    </div>
  );
}

type ProductVisualProps = {
  product: Product;
  language: AppLanguage;
  className?: string;
  sizes?: string;
  priority?: boolean;
  "aria-hidden"?: boolean;
  visualSrc?: string;
  visualAlt?: LocalizedText;
  density?: ProductVisualDensity;
};

export function ProductVisual({
  product,
  language,
  className = "",
  sizes = "(max-width: 428px) 90vw, 384px",
  priority = false,
  "aria-hidden": ariaHidden,
  visualSrc,
  visualAlt,
  density = "card",
}: ProductVisualProps) {
  const primary = (visualSrc !== undefined ? visualSrc : product.images.main)?.trim() ?? "";
  const alt = visualAlt ?? product.imageAlt.main;

  return (
    <ProductVisualTrack
      key={`${product.id}:${primary}`}
      product={product}
      language={language}
      primary={primary}
      alt={alt}
      className={className}
      sizes={sizes}
      priority={priority}
      ariaHidden={ariaHidden}
      density={density}
    />
  );
}

type GalleryThumbMediaProps = {
  product: Product;
  language: AppLanguage;
  trimmed: string;
};

function GalleryThumbMedia({ product, language, trimmed }: GalleryThumbMediaProps) {
  const [broken, setBroken] = useState(false);

  if (!trimmed || broken) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-[color:var(--brand-burgundy-soft)]">
        <span className="sr-only">{translations[language].productPage.photoComingSoon}</span>
        <div className={`absolute inset-0 bg-gradient-to-br ${product.visualGradient} opacity-[0.96]`} />
        <div className="relative flex h-full flex-col items-center justify-center px-0.5">
          <span className="text-[11px] font-black leading-none text-white/95">{product.fallbackInitials}</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={trimmed}
      alt=""
      fill
      className="object-cover"
      sizes="54px"
      onError={() => setBroken(true)}
    />
  );
}

type ProductGalleryThumbnailProps = {
  slotKey: string;
  product: Product;
  language: AppLanguage;
  src: string;
  alt: LocalizedText;
  active: boolean;
  reduced: boolean;
  onSelect: () => void;
};

export function ProductGalleryThumbnail({
  slotKey,
  product,
  language,
  src,
  alt,
  active,
  reduced,
  onSelect,
}: ProductGalleryThumbnailProps) {
  const trimmed = src.trim();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={scaleTapWhile(reduced)}
      animate={
        reduced
          ? undefined
          : {
              scale: active ? 1.03 : 1,
            }
      }
      transition={{ duration: 0.22, ease: easePremium }}
      className={`relative h-[3.35rem] w-[3.35rem] shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
        active
          ? "border-[color:var(--brand-gold)] shadow-md shadow-[rgba(225,189,115,0.25)] ring-1 ring-[color:var(--brand-gold-soft)]/35"
          : "border-[color:rgba(225,189,115,0.35)] bg-[color:var(--card-beige)]/90 shadow-sm ring-1 ring-[color:var(--border-soft)]"
      }`}
      aria-current={active}
      aria-label={alt[language]}
    >
      <GalleryThumbMedia key={`${slotKey}:${trimmed}`} product={product} language={language} trimmed={trimmed} />
    </motion.button>
  );
}
