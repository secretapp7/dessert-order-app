import type { AppLanguage as PrismaAppLanguage } from "@prisma/client";

import { isPrismaArabic } from "@/lib/language/prisma-language";

export type CustomerWhatsappTemplate = "thank_you" | "payment_reminder" | "follow_up";

function resolveLanguage(
  preferredLanguage: string | null | undefined,
  latestOrderLanguage: PrismaAppLanguage | null | undefined,
): "en" | "ar" {
  const pref = preferredLanguage?.trim().toLowerCase();
  if (pref === "ar") return "ar";
  if (pref === "en") return "en";
  if (latestOrderLanguage && isPrismaArabic(latestOrderLanguage)) return "ar";
  return "en";
}

export function buildCustomerWhatsappMessage(
  template: CustomerWhatsappTemplate,
  input: {
    customerName: string;
    preferredLanguage?: string | null;
    latestOrderLanguage?: PrismaAppLanguage | null;
    publicId?: string;
    unpaidAmountOmr?: number;
  },
): string {
  const name = input.customerName.trim() || (resolveLanguage(input.preferredLanguage, input.latestOrderLanguage) === "ar" ? "عزيزتي" : "there");
  const lang = resolveLanguage(input.preferredLanguage, input.latestOrderLanguage);

  if (template === "thank_you") {
    if (lang === "ar") {
      return `مرحباً ${name} 💛

شكراً لاختيارك Coco Treats. يسعدنا دائماً تجهيز شيء حلو لك.`;
    }
    return `Hi ${name} 💛

Thank you for choosing Coco Treats. We're always happy to prepare something sweet for you.`;
  }

  if (template === "payment_reminder") {
    const amount = (input.unpaidAmountOmr ?? 0).toFixed(3);
    const publicId = input.publicId?.trim() || "—";
    if (lang === "ar") {
      return `مرحباً ${name} 💛

تذكير بسيط بخصوص طلبك من Coco Treats رقم ${publicId}. المبلغ المتبقي هو ${amount} ريال.`;
    }
    return `Hi ${name} 💛

Just a gentle reminder regarding your Coco Treats order ${publicId}. The remaining amount is ${amount} OMR.`;
  }

  if (lang === "ar") {
    return `مرحباً ${name} 💛

نتمنى أن طلبك من Coco Treats أعجبك. إذا احتجتِ أي شيء أو حبيتي تطلبي مرة أخرى، يسعدنا خدمتك.`;
  }
  return `Hi ${name} 💛

We hope you enjoyed your Coco Treats order. If you need anything or would like to order again, we're happy to help.`;
}

export function buildCustomerWhatsappUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`;
}

export function buildCustomerChatWhatsappUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `https://api.whatsapp.com/send?phone=${digits}`;
}
