import { brand } from "@/config/brand";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";

type SiteFooterProps = {
  language: AppLanguage;
  variant?: "default" | "compact";
};

export function SiteFooter({ language, variant = "default" }: SiteFooterProps) {
  const t = translations[language];

  if (variant === "compact") {
    return (
      <footer className="mt-5 border-t border-[color:var(--border-soft)]/90 pt-3 text-center text-[10px] leading-relaxed text-[color:var(--foreground)]/58">
        <a
          href={brand.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[color:var(--brand-burgundy-soft)] hover:underline"
        >
          {brand.instagramHandle}
        </a>
        <p className="mt-1 text-[color:var(--foreground)]/55">
          {brand.city[language]}
          <span className="text-[color:var(--brand-gold-muted)]" aria-hidden>
            {" "}
            ·{" "}
          </span>
          {t.footer.preorder}
        </p>
      </footer>
    );
  }

  return (
    <footer className="mt-8 border-t border-[color:var(--border-soft)] pb-10 pt-4 text-center text-[11px] text-[color:var(--foreground)]/62">
      <p className="font-semibold text-[color:var(--accent-cocoa)]">{brand.name[language]}</p>
      <p className="mt-1">
        <span className="text-[color:var(--foreground)]/55">{t.footer.location}</span>
        <span className="text-[color:var(--brand-gold-muted)]" aria-hidden>
          {" "}
          ·{" "}
        </span>
        {brand.city[language]}
      </p>
      <p className="mt-1 text-[10px] text-[color:var(--foreground)]/52">{t.footer.igLine}</p>
      <p className="mt-2 text-[11px] text-[color:var(--foreground)]/45">
        <a
          href={brand.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[color:var(--brand-burgundy-soft)] hover:underline"
        >
          {brand.instagramHandle}
        </a>
      </p>
    </footer>
  );
}
