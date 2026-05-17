import type { AppLanguage } from "@/config/translations";

export function formatNeededDate(language: AppLanguage, isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-").map((p) => Number(p));
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!y || !mo || !d) return isoDate;
  const utc = Date.UTC(y, mo - 1, d);
  try {
    return new Date(utc).toLocaleDateString(language === "ar" ? "ar-OM" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return isoDate;
  }
}
