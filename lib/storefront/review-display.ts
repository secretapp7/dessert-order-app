import type { AppLanguage } from "@/config/translations";

/** Shared review shape for ReviewCard and public pages (DB or static fallback). */
export type StorefrontReview = {
  id: string;
  customerName: string;
  customerInitials: string;
  rating: number;
  productSlug: string | null;
  text: { en: string; ar: string };
  dateLabel: { en: string; ar: string };
  verifiedOrder: boolean;
};

export type ProductRatingSummary = {
  average: number;
  count: number;
};

export function deriveCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function formatReviewDateLabel(date: Date, language: AppLanguage): string {
  try {
    return new Intl.DateTimeFormat(language === "ar" ? "ar-OM" : "en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 7);
  }
}

export function reviewDisplayText(review: StorefrontReview, language: AppLanguage): string {
  if (language === "ar" && review.text.ar?.trim()) return review.text.ar.trim();
  return review.text.en;
}

export function ratingForProductSlug(
  summaries: Record<string, ProductRatingSummary>,
  productSlug: string,
): ProductRatingSummary {
  const specific = summaries[productSlug];
  if (specific && specific.count > 0) return specific;
  return summaries.global ?? { average: 0, count: 0 };
}
