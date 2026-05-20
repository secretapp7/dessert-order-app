"use client";

import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { useAppLanguage } from "@/components/language-provider";
import { brand } from "@/config/brand";
import { buildWhatsappUrl } from "@/config/whatsapp";
import { usePublicBusinessSettings } from "@/components/public-settings-provider";
import { fadeInVariants, navSpringTransition, scaleTapWhile } from "@/lib/motion";

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 12a8 8 0 01-11.86 7.07L4 20l1.02-2.94A8 8 0 1120 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
    </svg>
  );
}

function matchMenuRoute(path: string | null) {
  if (!path) return false;
  return path === "/menu" || path.startsWith("/products/");
}

function matchOrderRoute(path: string | null) {
  if (!path) return false;
  return path === "/order" || path.startsWith("/order?");
}

function matchContactRoute(path: string | null) {
  return path === "/contact";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useAppLanguage();
  const settings = usePublicBusinessSettings();
  const reduced = useReducedMotion() ?? false;

  const waHref = buildWhatsappUrl(t.waPrefill.hello, settings.whatsappNumber);

  const navItems = [
    { key: "home", href: "/", label: t.nav.home, match: (path: string | null) => path === "/" },
    { key: "menu", href: "/menu", label: t.nav.menu, match: matchMenuRoute },
    { key: "order", href: "/order", label: t.nav.order, match: matchOrderRoute },
    { key: "contact", href: "/contact", label: t.nav.contact, match: matchContactRoute },
  ] as const;

  const tapScale = scaleTapWhile(reduced);

  return (
    <div className="min-h-[100dvh] sm:flex sm:min-h-screen sm:items-center sm:justify-center sm:bg-[color:var(--card-beige)] sm:py-8 sm:pb-10">
      <div
        className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-[color:var(--background)] shadow-none sm:mx-auto sm:h-[min(52rem,92vh)] sm:max-h-[92vh] sm:w-full sm:max-w-[428px] sm:rounded-[2rem] sm:border sm:border-[color:var(--brand-gold)]/35 sm:shadow-[0_24px_60px_-24px_rgba(90,0,22,0.22)]"
        id="app-phone-frame"
      >
        <motion.header
          variants={fadeInVariants(reduced)}
          initial="hidden"
          animate="visible"
          className="z-20 shrink-0 border-b border-[color:rgba(216,180,95,0.45)] bg-gradient-to-b from-[color:var(--card-cream)] via-[color:var(--card-beige)] to-[#f2e2c2] px-3 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] shadow-[0_6px_18px_-10px_rgba(90,0,22,0.12)]"
        >
          <span className="sr-only">{brand.name[language]}</span>
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex min-w-0 flex-1 items-center justify-start">
              <BrandLogo variant="header" language={language} className="-ms-0.5" />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <motion.a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={tapScale}
                transition={{ duration: 0.15 }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--brand-burgundy)]/30 bg-[color:var(--card-cream)] text-[color:var(--brand-burgundy)] shadow-sm ring-1 ring-[color:var(--brand-gold)]/35 transition-colors hover:border-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]/25 focus-visible:outline-none active:bg-[color:var(--brand-burgundy)]/10"
                aria-label={t.header.waAria}
              >
                <ChatBubbleIcon className="h-[18px] w-[18px]" />
              </motion.a>
              <motion.button
                type="button"
                onClick={toggleLanguage}
                whileTap={tapScale}
                transition={{ duration: 0.15 }}
                className="inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-full border border-[color:var(--brand-burgundy)]/35 bg-[color:var(--card-cream)] px-2.5 text-[10px] font-semibold text-[color:var(--brand-burgundy)] shadow-sm ring-1 ring-[color:var(--brand-gold)]/30 transition-colors hover:border-[color:var(--brand-gold)] hover:bg-[color:var(--brand-gold-soft)]/30 focus-visible:outline-none active:bg-[color:var(--brand-burgundy)]/10"
                aria-label={t.languageLabel}
              >
                {t.languageLabel}
              </motion.button>
            </div>
          </div>
        </motion.header>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 [-ms-overflow-style:none] [scrollbar-width:thin]"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-nav-h))" }}
          >
            {children}
          </div>

          <nav
            className="absolute bottom-0 left-0 right-0 z-30 shrink-0 border-t border-[color:var(--border-soft)] bg-[color:var(--background)] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_28px_-14px_rgba(90,0,22,0.08)] backdrop-blur-md"
            aria-label={language === "ar" ? "التنقل" : "Navigation"}
            style={{ height: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))" }}
          >
            <LayoutGroup id="bottom-nav-group">
              <div className="grid grid-cols-4 gap-0.5 px-1">
                {navItems.map((item) => {
                  const active = item.match(pathname);

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`relative flex min-h-11 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl px-1 py-1 text-[9px] font-semibold leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)] ${
                        active ? "text-[color:var(--card-cream)]" : "text-[color:var(--muted-text)] hover:bg-[color:var(--card-beige)]/80"
                      }`}
                      scroll={false}
                    >
                      {active ? (
                        <motion.span
                          layoutId="bottom-nav-active-pill"
                          className="absolute inset-0 z-0 rounded-xl bg-[color:var(--brand-burgundy)] shadow-[inset_0_1px_0_rgba(232,205,134,0.22)] ring-1 ring-[color:var(--brand-gold-soft)]/45"
                          transition={navSpringTransition(reduced)}
                        />
                      ) : null}
                      <span className="relative z-10 text-[14px] leading-none opacity-90" aria-hidden>
                        {item.key === "home" ? "⌂" : item.key === "menu" ? "☰" : item.key === "order" ? "◆" : "@"}
                      </span>
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </LayoutGroup>
          </nav>
        </div>
      </div>
    </div>
  );
}
