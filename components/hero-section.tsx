"use client";

import { useAppLanguage } from "@/components/language-provider";
import { brand } from "@/config/brand";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";

type HeroSectionProps = {
  language?: AppLanguage;
};

export function HeroSection(
  // Legacy: some pages still pass `language`; the hook is the source of truth.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accepted for API compatibility only
  _props: HeroSectionProps = {},
) {
  const { language } = useAppLanguage();
  const t = translations[language];

  const madeInPrefix = language === "ar" ? "طُهي طازج في" : "Freshly made in";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[#e7d4c2] bg-gradient-to-br from-[#fff9f3] via-[#fbeee4] to-[#f8dfe0] p-6 shadow-[0_20px_40px_-25px_rgba(75,46,33,0.45)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#fff3cf] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[#f5d4dc] blur-2xl" />

      <div className="relative">
        <p className="inline-flex rounded-full border border-[#d6b792] bg-[#fff5e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#9f7a52]">
          {madeInPrefix} {brand.city[language]}
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-[#4b2e21] sm:text-4xl">
          {brand.name[language]}
        </h1>
        <p className="mt-2 text-lg font-medium text-[#7f4f58]">{t.home.brandTagline}</p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6b4f3f]">{t.home.heroSubtitle}</p>
        <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:max-w-md">
          <div className="rounded-2xl bg-[#fff6ea] px-3 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#9f7a52]">Availability</p>
            <p className="mt-1 text-sm font-semibold text-[#5a3829]">{t.home.pillPreorder}</p>
          </div>
          <div className="rounded-2xl bg-[#fff0f2] px-3 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-[#9f7a52]">Ordering</p>
            <p className="mt-1 text-sm font-semibold text-[#5a3829]">{t.contactPage.whatsappCta}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#7f6250]">
          <span className="rounded-full bg-[#fff0e0] px-3 py-1">Premium ingredients</span>
          <span className="rounded-full bg-[#fbe5e1] px-3 py-1">Small-batch quality</span>
          <span className="rounded-full bg-[#f6ead7] px-3 py-1">Instagram-ready gifting</span>
        </div>
      </div>
    </section>
  );
}
