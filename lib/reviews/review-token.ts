import "server-only";

import { randomBytes } from "node:crypto";

import type { AppLanguage as PrismaAppLanguage } from "@prisma/client";

import { getPublicSiteUrl } from "@/lib/site/public-site-url";
import { isPrismaArabic } from "@/lib/language/prisma-language";
import { prisma } from "@/lib/db/prisma";

const TOKEN_BYTES = 32;

export function generateReviewToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

type OrderReviewLinkInput = {
  publicId: string;
  reviewToken: string | null;
};

export function buildOrderReviewUrl(
  order: OrderReviewLinkInput,
  baseUrl?: string | null,
): string {
  const origin = getPublicSiteUrl(baseUrl);
  const token = order.reviewToken?.trim();
  if (!token) return `${origin}/review/${order.publicId}`;
  return `${origin}/review/${order.publicId}?token=${encodeURIComponent(token)}`;
}

export function buildReviewWhatsAppMessage(
  customerName: string,
  reviewUrl: string,
  language: PrismaAppLanguage,
): string {
  const name = customerName.trim() || (isPrismaArabic(language) ? "عزيزتي" : "there");

  if (isPrismaArabic(language)) {
    return `مرحباً ${name} 💛

شكراً لطلبك من Coco Treats. نتمنى أن الحلى أضاف لمسة حلوة ليومك.

إذا عندك دقيقة، يسعدنا نسمع رأيك. تقييمك يساعدنا نطوّر شغلنا ويساعد العملاء الجدد يختارون بثقة.

اكتبي تقييمك من هنا:
${reviewUrl}

شكراً لدعمك مشروعنا المنزلي 🤍
Coco Treats`;
  }

  return `Hi ${name} 💛

Thank you for ordering from Coco Treats. We hope your dessert added a sweet touch to your day.

When you have a moment, we would love to hear your feedback. Your review helps us improve and helps other customers choose with confidence.

Leave your review here:
${reviewUrl}

Thank you for supporting our small home business 🤍
Coco Treats`;
}

export async function ensureOrderReviewToken(orderId: string): Promise<string> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { reviewToken: true },
  });
  if (existing?.reviewToken) return existing.reviewToken;

  for (let attempt = 0; attempt < 5; attempt++) {
    const token = generateReviewToken();
    try {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { reviewToken: token },
        select: { reviewToken: true },
      });
      return updated.reviewToken!;
    } catch {
      const row = await prisma.order.findUnique({
        where: { id: orderId },
        select: { reviewToken: true },
      });
      if (row?.reviewToken) return row.reviewToken;
    }
  }

  throw new Error("Could not assign review token.");
}
