import type { AppLanguage as PrismaAppLanguage } from "@prisma/client";

import type { AppLanguage } from "@/config/translations";

export function uiLanguageFromPrisma(language: PrismaAppLanguage): AppLanguage {
  return language === "AR" ? "ar" : "en";
}

export function isPrismaArabic(language: PrismaAppLanguage): boolean {
  return language === "AR";
}
