import type { LocalizedText } from "@/data/products";

export type ReviewProductId = "tiramisu" | "jelly-cheesecake" | "general";

export type Review = {
  id: string;
  customerName: string;
  customerInitials: string;
  rating: number;
  productId: ReviewProductId;
  text: LocalizedText;
  dateLabel: LocalizedText;
  verifiedOrder: boolean;
};

export const reviews: Review[] = [
  {
    id: "r1",
    customerName: "Amna K.",
    customerInitials: "AK",
    rating: 5,
    productId: "tiramisu",
    text: {
      en: "The tiramisu was soft, fresh, and perfectly balanced. Beautiful packaging too.",
      ar: "التيراميسو كان طري ولذيذ ومتوازن، والتغليف كان مرتباً جداً.",
    },
    dateLabel: { en: "Mar 2026", ar: "مارس ٢٠٢٦" },
    verifiedOrder: true,
  },
  {
    id: "r2",
    customerName: "Sultan M.",
    customerInitials: "SM",
    rating: 5,
    productId: "jelly-cheesecake",
    text: {
      en: "The jelly cheesecake was light and refreshing. Perfect for a family gathering.",
      ar: "جيلي تشيز كيك كان خفيفاً ومنعشاً ومناسباً للضيافة مع العائلة.",
    },
    dateLabel: { en: "Feb 2026", ar: "فبراير ٢٠٢٦" },
    verifiedOrder: true,
  },
  {
    id: "r3",
    customerName: "Layla H.",
    customerInitials: "LH",
    rating: 5,
    productId: "general",
    text: {
      en: "Ordering was easy and the dessert arrived chilled and neatly packed.",
      ar: "الطلب كان سهلاً والحلى وصل بارد ومرتب.",
    },
    dateLabel: { en: "Jan 2026", ar: "يناير ٢٠٢٦" },
    verifiedOrder: true,
  },
  {
    id: "r4",
    customerName: "Mohammed Al R.",
    customerInitials: "MR",
    rating: 4,
    productId: "tiramisu",
    text: {
      en: "Rich cocoa finish and silky texture — tasted like something from a small Paris kitchen.",
      ar: "نكهة الكاكاو غنية والقوام حريري، يشبه ما أجده في مخابز المنزل المتخصصة.",
    },
    dateLabel: { en: "Feb 2026", ar: "فبراير ٢٠٢٦" },
    verifiedOrder: true,
  },
  {
    id: "r5",
    customerName: "Sarah P.",
    customerInitials: "SP",
    rating: 5,
    productId: "jelly-cheesecake",
    text: {
      en: "Elegant blush layers and subtle sweetness — guests asked where it was from.",
      ar: "طبقات لونها ناعم والحلاوة متوازنة — الضيوف سألوا من أين الطلب.",
    },
    dateLabel: { en: "Mar 2026", ar: "مارس ٢٠٢٦" },
    verifiedOrder: false,
  },
  {
    id: "r6",
    customerName: "Fatima Z.",
    customerInitials: "FZ",
    rating: 5,
    productId: "general",
    text: {
      en: "Lovely attention to timing and communication on WhatsApp. Felt cared for.",
      ar: "تنظيم الوقت والتواصل عبر الواتساب ممتاز — حسيت باهتمام حقيقي.",
    },
    dateLabel: { en: "Apr 2026", ar: "أبريل ٢٠٢٦" },
    verifiedOrder: true,
  },
];

function reviewsForAggregation(productId?: ReviewProductId) {
  if (productId == null) return reviews;
  return reviews.filter((r) => r.productId === productId || r.productId === "general");
}

export function getAverageRating(productId?: ReviewProductId): number {
  const list = reviewsForAggregation(productId);
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / list.length) * 10) / 10;
}

export function getReviewCount(productId?: ReviewProductId): number {
  return reviewsForAggregation(productId).length;
}

export function getReviewsForProduct(productId: Exclude<ReviewProductId, "general">) {
  return reviews.filter((r) => r.productId === productId || r.productId === "general").sort(sortPremiumFirst);
}

export function getReviewsForProductDetail(productId: Exclude<ReviewProductId, "general">, limit: number) {
  const specific = reviews.filter((r) => r.productId === productId).sort(sortPremiumFirst);
  const generalPool = reviews.filter((r) => r.productId === "general").sort(sortPremiumFirst);
  return [...specific, ...generalPool].slice(0, limit);
}

function sortPremiumFirst(a: Review, b: Review) {
  if (b.verifiedOrder !== a.verifiedOrder) return (b.verifiedOrder ? 1 : 0) - (a.verifiedOrder ? 1 : 0);
  if (b.rating !== a.rating) return b.rating - a.rating;
  return a.id.localeCompare(b.id);
}

export function getFeaturedReviews(limit: number) {
  return [...reviews].sort(sortPremiumFirst).slice(0, limit);
}

export function reviewsForDetailOnly(productId: Exclude<ReviewProductId, "general">) {
  return reviews.filter((r) => r.productId === productId).sort(sortPremiumFirst);
}
