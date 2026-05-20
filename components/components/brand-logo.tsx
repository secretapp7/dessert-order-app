"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { brand } from "@/config/brand";
import type { AppLanguage } from "@/config/translations";

export type BrandLogoVariant = "header" | "hero" | "contact" | "compact";

const VARIANT_BOX: Record<BrandLogoVariant, { maxH: number; maxW: number }> = {
  header: { maxH: 38, maxW: 112 },
  hero: { maxH: 76, maxW: 200 },
  contact: { maxH: 72, maxW: 188 },
  compact: { maxH: 30, maxW: 76 },
};

type BrandLogoProps = {
  variant: BrandLogoVariant;
  language: AppLanguage;
  className?: string;
  /** Logo on burgundy: subtle glow for contrast—no boxed background. Disabled with reduced motion. */
  onDarkBackground?: boolean;
};

export function BrandLogo({
  variant,
  language,
  className = "",
  onDarkBackground = false,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  const alt = brand.logoAlt[language];
  const { maxH, maxW } = VARIANT_BOX[variant];
  const sizeStyle = { maxHeight: maxH, maxWidth: maxW } as const;

  let inner: ReactNode;

  if (failed) {
    inner = (
      <span
        className={`flex max-w-full items-center justify-center px-1 text-center text-[clamp(10px,2.65vw,14px)] font-semibold leading-tight tracking-tight ${
          onDarkBackground ? "text-[color:var(--brand-gold-soft)]" : "text-[color:var(--brand-burgundy)]"
        }`}
        role="img"
        aria-label={alt}
        style={sizeStyle}
      >
        {brand.name[language]}
      </span>
    );
  } else {
    inner = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element -- Local SVG brand asset */}
        <img
          src={brand.logo}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={320}
          height={120}
          className={`h-auto w-auto max-h-full max-w-full object-contain object-center ${onDarkBackground ? "brand-logo-on-dark" : ""}`}
          style={sizeStyle}
          onError={() => setFailed(true)}
        />
      </>
    );
  }

  return <span className={`inline-flex max-w-full shrink-0 items-center justify-center ${className}`.trim()}>{inner}</span>;
}
