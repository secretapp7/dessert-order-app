"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { BrandLogo } from "@/components/brand-logo";
import { ScreenEnter } from "@/components/motion/screen-enter";
import { useAppLanguage } from "@/components/language-provider";
import { brand } from "@/config/brand";
import { buildWhatsappUrl } from "@/config/whatsapp";
import { easePremium, scaleTapWhile, staggerContainerVariants, staggerItemVariants } from "@/lib/motion";

const MotionLink = motion.create(Link);

export default function ContactPage() {
  const { language, t } = useAppLanguage();
  const reduced = useReducedMotion() ?? false;
  const tapScale = scaleTapWhile(reduced);

  const waHref = buildWhatsappUrl(t.contactPage.whatsappPrefill);
  const { businessNotes } = t;

  const infoPulse = [
    { key: "pre", body: businessNotes.preorder24h },
    { key: "confirm", body: t.contactPage.noteOrders },
    { key: "deliver", body: businessNotes.deliveryFeeWhatsApp },
    { key: "pay", body: businessNotes.paymentWhatsApp },
  ] as const;

  const trust = [
    {
      key: "wa",
      title: t.contactPage.trustWhatsappTitle,
      body: t.contactPage.trustWhatsappBody,
      icon: "●",
    },
    {
      key: "del",
      title: t.contactPage.trustDeliveryTitle,
      body: t.contactPage.trustDeliveryBody,
      icon: "◇",
    },
    {
      key: "pre",
      title: t.contactPage.trustPreorderTitle,
      body: t.contactPage.trustPreorderBody,
      icon: "✦",
    },
  ] as const;

  return (
    <AppShell>
      <ScreenEnter>
        <motion.div
          className="space-y-5 px-0.5 pb-4 pt-2"
          variants={staggerContainerVariants(reduced)}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={staggerItemVariants(reduced)}
            className="overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-gradient-to-br from-[color:var(--card-cream)] to-[color:var(--card-beige)] px-4 py-5 text-center shadow-[0_8px_28px_-16px_rgba(90,0,22,0.1)] ring-1 ring-[color:var(--brand-gold-soft)]/25"
          >
            <div className="flex justify-center">
              <BrandLogo variant="contact" language={language} />
            </div>
            <h1 className="mt-4 text-[19px] font-bold tracking-tight text-[color:var(--brand-burgundy)]">
              {t.contactPage.screenTitle}
            </h1>
            <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[color:var(--muted-text)]">{t.contactPage.locationLine}</p>
          </motion.div>

          <motion.a
            variants={staggerItemVariants(reduced)}
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            whileTap={tapScale}
            whileHover={reduced ? undefined : { scale: 1.008 }}
            transition={{ duration: 0.22, ease: easePremium }}
            className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[color:var(--brand-gold)] bg-[color:var(--brand-burgundy)] px-4 text-[13px] font-semibold text-[color:var(--card-cream)] shadow-[0_14px_36px_-18px_rgba(58,32,26,0.42)] ring-1 ring-[color:var(--border-soft)] active:brightness-95"
          >
            <span aria-hidden className="text-lg text-[#25D366]">
              ⎙
            </span>
            {t.contactPage.whatsappCta}
          </motion.a>

          <motion.div
            variants={staggerItemVariants(reduced)}
            className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-start">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
                  {t.contactPage.instagramLabel}
                </p>
                <p className="mt-1 font-mono text-[14px] font-semibold text-[color:var(--foreground)]">{brand.instagramHandle}</p>
                <p className="mt-1.5 text-[10px] leading-snug text-[color:var(--foreground)]/68">{t.contactPage.trustInstagramBody}</p>
              </div>
              <MotionLink
                href={`https://instagram.com/${brand.instagramHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={tapScale}
                whileHover={reduced ? undefined : { opacity: 0.92 }}
                transition={{ duration: 0.18, ease: easePremium }}
                className="shrink-0 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--brand-burgundy)] px-3 py-1.5 text-[10px] font-semibold text-[color:var(--card-cream)] shadow-sm active:brightness-110"
              >
                {t.contactPage.openInstagramProfile}
              </MotionLink>
            </div>
          </motion.div>

          <motion.section variants={staggerItemVariants(reduced)} className="grid grid-cols-2 gap-2">
            {trust.map((item, index) => (
              <motion.div
                key={item.key}
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduced ? 0 : 0.08 + index * 0.045,
                  duration: reduced ? 0.12 : 0.26,
                  ease: easePremium,
                }}
                className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-3 shadow-[0_8px_24px_-18px_rgba(65,6,19,0.15)]"
              >
                <span className="text-[15px] leading-none text-[color:var(--brand-gold)]" aria-hidden>
                  {item.icon}
                </span>
                <p className="mt-2 text-[11px] font-bold leading-tight text-[color:var(--brand-burgundy)]">{item.title}</p>
                <p className="mt-1 text-[9px] leading-snug text-[color:var(--foreground)]/65">{item.body}</p>
              </motion.div>
            ))}
          </motion.section>

          <motion.ul
            variants={staggerItemVariants(reduced)}
            className="space-y-2 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-3 text-[10px] leading-relaxed text-[color:var(--foreground)]/75"
          >
            {infoPulse.map((item, i) => (
              <li key={item.key} className={`flex gap-2 ${i < infoPulse.length - 1 ? "border-b border-dashed border-[color:var(--border-soft)] pb-2" : ""}`}>
                <span className="mt-0.5 shrink-0 text-[color:var(--accent-gold)]" aria-hidden>
                  ●
                </span>
                <span>{item.body}</span>
              </li>
            ))}
          </motion.ul>

          <motion.section
            variants={staggerItemVariants(reduced)}
            className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.62)]"
          >
            <h2 className="text-[11px] font-bold tracking-tight text-[color:var(--brand-burgundy)]">{t.faqSection.title}</h2>
            <div className="mt-2 space-y-1.5">
              {t.faqSection.items.map((item, index) => (
                <details
                  key={`${item.q}-${index}`}
                  className="group rounded-xl border border-[color:var(--border-soft)]/90 bg-[color:var(--card-cream)] px-2.5 py-2"
                >
                  <summary className="cursor-pointer select-none text-[10px] font-semibold leading-snug text-[color:var(--foreground)] marker:text-[color:var(--brand-gold-muted)]">
                    {item.q}
                  </summary>
                  <p className="mt-1.5 border-t border-dashed border-[color:var(--border-soft)] pt-1.5 text-[9px] leading-snug text-[color:var(--foreground)]/72">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </ScreenEnter>
    </AppShell>
  );
}
