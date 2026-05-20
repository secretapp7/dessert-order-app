import type { AppLanguage } from "@/config/translations";

export function formatRatingValue(language: AppLanguage, value: number) {
  if (language === "ar") {
    return value.toLocaleString("ar-u-nu-arab", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return value.toFixed(1);
}

export function formatReviewCount(language: AppLanguage, count: number) {
  if (language === "ar") return count.toLocaleString("ar-u-nu-arab");
  return String(count);
}

export function formatLocaleQuantity(language: AppLanguage, qty: number) {
  if (language === "ar") return qty.toLocaleString("ar-u-nu-arab");
  return String(qty);
}
