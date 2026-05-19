"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ScreenEnter } from "@/components/motion/screen-enter";
import { ProductCard } from "@/components/product-card";
import { useAppLanguage } from "@/components/language-provider";
import { brand } from "@/config/brand";
import type { MenuCategory } from "@/data/products";
import type { StorefrontOffer, StorefrontProduct } from "@/lib/storefront/types";
import { scaleTapWhile, staggerContainerVariants, staggerItemVariants } from "@/lib/motion";

type MenuPageClientProps = {
  products: StorefrontProduct[];
  categoryIds: Array<MenuCategory | "all">;
  homeOffer: StorefrontOffer | null;
};

export function MenuPageClient({ products, categoryIds, homeOffer }: MenuPageClientProps) {
  const { language, t } = useAppLanguage();
  const reduced = useReducedMotion() ?? false;
  const tapScale = scaleTapWhile(reduced);
  const [activeCategory, setActiveCategory] = useState<MenuCategory | "all">("all");
  const [query, setQuery] = useState("");

  const categoryLabel = (id: MenuCategory | "all") => {
    if (id === "all") return t.home.categories.all;
    return t.home.categories[id];
  };

  const filteredProducts = useMemo(() => {
    let list =
      activeCategory === "all"
        ? products
        : activeCategory === "offers"
          ? products.filter((p) => p.menuCategory === "offers")
          : products.filter((p) => p.menuCategory === activeCategory);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const en = p.name.en.toLowerCase();
        const ar = p.name.ar;
        return en.includes(q) || ar.includes(query.trim());
      });
    }
    return list;
  }, [activeCategory, products, query]);

  const offerTitle = homeOffer?.title[language] ?? t.offers.launchBoxTitle;
  const offerBody = homeOffer?.description[language] ?? t.offers.launchBoxBody;
  const offerPrice =
    homeOffer != null ? `${homeOffer.priceOmr.toFixed(2)} ${brand.currency}` : null;

  return (
    <AppShell>
      <ScreenEnter>
        <motion.div
          className="space-y-3 pb-4 pt-1"
          variants={staggerContainerVariants(reduced)}
          initial="hidden"
          animate="visible"
        >
          <motion.section
            variants={staggerItemVariants(reduced)}
            className="-mx-3 rounded-b-3xl bg-gradient-to-b from-[color:var(--brand-burgundy)] via-[color:var(--brand-burgundy-strong)] to-[color:var(--brand-red-wine)] px-3 pb-4 pt-2 text-[color:var(--card-cream)] shadow-[inset_0_1px_0_rgba(231,201,122,0.14)]"
          >
            <label className="relative block">
              <span className="sr-only">{t.home.searchPlaceholder}</span>
              <span
                className="pointer-events-none absolute start-3 top-1/2 z-[1] -translate-y-1/2 text-[14px] text-[color:var(--brand-gold-muted)]"
                aria-hidden
              >
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.home.searchPlaceholder}
                className="block w-full rounded-2xl border border-[color:var(--border-soft)] bg-black/15 py-2.5 pe-3 ps-10 text-[12px] text-[color:var(--card-cream)] outline-none ring-0 placeholder:text-[color:var(--card-cream)]/55 focus:border-[color:var(--brand-gold)] focus:ring-1 focus:ring-[color:var(--brand-gold-muted)]"
                autoComplete="off"
                aria-label={t.home.searchPlaceholder}
              />
            </label>

            <motion.div
              variants={staggerItemVariants(reduced)}
              className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {categoryIds.map((id) => {
                const active = id === activeCategory;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => setActiveCategory(id)}
                    whileTap={tapScale}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-gold)] text-[color:var(--brand-burgundy)] shadow-sm"
                        : "border-[color:var(--border-soft)] bg-white/[0.07] text-[color:var(--card-cream)]/95 active:bg-white/12"
                    }`}
                  >
                    {categoryLabel(id)}
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="overflow-hidden rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-3.5 shadow-[0_10px_28px_-18px_rgba(74,6,20,0.1)] ring-1 ring-[color:var(--brand-gold-soft)]/25"
          >
            <motion.div variants={staggerItemVariants(reduced)} className="flex items-start gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--brand-gold)]/45 bg-[color:var(--card-beige)] text-sm text-[color:var(--brand-burgundy)] shadow-inner">
                ✦
              </span>
              <motion.div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-gold-muted)]">
                  {offerTitle}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-snug text-[color:var(--muted-text)]">
                  {offerBody}
                  {offerPrice ? (
                    <span className="mt-1 block font-semibold text-[color:var(--brand-burgundy)]">
                      {offerPrice}
                    </span>
                  ) : null}
                </p>
                <motion.span whileTap={tapScale} className="mt-2 inline-block">
                  <Link
                    href="/order"
                    className="inline-flex min-h-9 items-center rounded-full bg-[color:var(--brand-burgundy)] px-4 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--card-cream)] shadow-md ring-1 ring-[color:var(--brand-gold)]/40 active:brightness-95"
                  >
                    {t.home.orderNow}
                  </Link>
                </motion.span>
              </motion.div>
            </motion.div>
          </motion.section>

          <motion.section variants={staggerItemVariants(reduced)}>
            <div className="flex flex-col gap-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} language={language} />
              ))}
              {filteredProducts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-6 text-center text-[12px] text-[color:var(--foreground)]/72">
                  {t.home.emptyCategory}
                </p>
              ) : null}
            </div>
          </motion.section>
        </motion.div>
      </ScreenEnter>
    </AppShell>
  );
}
