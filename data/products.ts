export type LocalizedText = {
  en: string;
  ar: string;
};

export type MenuCategory = "cakes" | "cups" | "trays" | "offers";

export type ProductSize = {
  id: string;
  label: LocalizedText;
  serves: LocalizedText;
  priceOmr: number;
};

/** Paths under `/public`. CMS can later populate these keys from uploads. */
export type ProductImages = {
  /** Primary listing photo — recommended for cards and order summary */
  main: string;
  /** Hero-style shot for featured placements (optional) */
  featured?: string;
  /** Detail gallery order — typically main angle, close-up, tray/context */
  gallery: string[];
};

/** Alt copy aligned with `images`: `main`, optional `featured`, one entry per `gallery` index */
export type ProductImageAlt = {
  main: LocalizedText;
  featured?: LocalizedText;
  gallery: LocalizedText[];
};

export type Product = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  badge: LocalizedText;
  images: ProductImages;
  imageAlt: ProductImageAlt;
  fallbackInitials: string;
  visualGradient: string;
  menuCategory: MenuCategory;
  sizes: ProductSize[];
};

export type ProductGallerySlot = {
  id: string;
  src: string;
  alt: LocalizedText;
};

const GALLERY_THUMB_COUNT = 3;

/** Fixed-length gallery strip for product detail (placeholder slots use empty `src`). */
export function getProductGallerySlots(product: Product): ProductGallerySlot[] {
  const paths = product.images.gallery;
  const alts = product.imageAlt.gallery;
  const fallbackAlt = product.imageAlt.main;
  const slots: ProductGallerySlot[] = [];
  for (let i = 0; i < GALLERY_THUMB_COUNT; i++) {
    slots.push({
      id: `${product.id}-gallery-${i}`,
      src: (paths[i] ?? "").trim(),
      alt: alts[i] ?? fallbackAlt,
    });
  }
  return slots;
}

/** Featured hero on Home: dedicated featured asset when present, otherwise main. */
export function getFeaturedPresentation(product: Product): { src: string; alt: LocalizedText } {
  const featured = product.images.featured?.trim();
  if (featured) {
    return { src: featured, alt: product.imageAlt.featured ?? product.imageAlt.main };
  }
  return { src: product.images.main.trim(), alt: product.imageAlt.main };
}

export const products: Product[] = [
  {
    id: "tiramisu",
    name: { en: "Tiramisu", ar: "تيراميسو" },
    description: {
      en: "Silky mascarpone layers, espresso-soaked ladyfingers, and a dusting of cocoa.",
      ar: "طبقات ناعمة من الكريمة مع نكهة القهوة والكاكاو، تحضر طازجة وتقدم باردة.",
    },
    badge: { en: "Signature", ar: "مميز" },
    images: {
      main: "/images/products/tiramisu/main.jpg",
      featured: "/images/products/tiramisu/featured.jpg",
      gallery: [
        "/images/products/tiramisu/main.jpg",
        "/images/products/tiramisu/closeup.jpg",
        "/images/products/tiramisu/tray.jpg",
      ],
    },
    imageAlt: {
      main: { en: "Tiramisu dessert", ar: "حلوى التيراميسو" },
      featured: { en: "Tiramisu featured", ar: "تيراميسو — لقطة مميزة" },
      gallery: [
        { en: "Tiramisu — full tray", ar: "تيراميسو — صينية كاملة" },
        { en: "Tiramisu — close-up", ar: "تيراميسو — لقطة قريبة" },
        { en: "Tiramisu — serving context", ar: "تيراميسو — سياق التقديم" },
      ],
    },
    fallbackInitials: "TI",
    visualGradient: "from-[#E7C97A] via-[#6B0F22] to-[#5A0016]",
    menuCategory: "trays",
    sizes: [
      {
        id: "mini-tray",
        label: { en: "Mini Tray", ar: "صينية صغيرة" },
        serves: { en: "Serves 2-3", ar: "تكفي 2-3" },
        priceOmr: 6.5,
      },
      {
        id: "classic-tray",
        label: { en: "Classic Tray", ar: "صينية كلاسيك" },
        serves: { en: "Serves 5-6", ar: "تكفي 5-6" },
        priceOmr: 12,
      },
      {
        id: "party-tray",
        label: { en: "Party Tray", ar: "صينية حفلات" },
        serves: { en: "Serves 10-12", ar: "تكفي 10-12" },
        priceOmr: 21,
      },
    ],
  },
  {
    id: "jelly-cheesecake",
    name: { en: "Jelly Cheesecake", ar: "جيلي تشيز كيك" },
    description: {
      en: "Creamy baked-style cheesecake with a glossy jelly topping and buttery biscuit base.",
      ar: "تشيز كيك بارد بطبقة جيلي خفيفة ومنعشة، مناسب للضيافة والمناسبات البسيطة.",
    },
    badge: { en: "Popular", ar: "الأكثر طلبا" },
    images: {
      main: "/images/products/jelly-cheesecake/main.jpg",
      featured: "/images/products/jelly-cheesecake/featured.jpg",
      gallery: [
        "/images/products/jelly-cheesecake/main.jpg",
        "/images/products/jelly-cheesecake/closeup.jpg",
        "/images/products/jelly-cheesecake/tray.jpg",
      ],
    },
    imageAlt: {
      main: { en: "Jelly cheesecake dessert", ar: "حلوى جيلي تشيز كيك" },
      featured: { en: "Jelly cheesecake featured", ar: "جيلي تشيز كيك — لقطة مميزة" },
      gallery: [
        { en: "Jelly cheesecake — whole cake", ar: "جيلي تشيز كيك — الكيك كاملاً" },
        { en: "Jelly cheesecake — close-up", ar: "جيلي تشيز كيك — لقطة قريبة" },
        { en: "Jelly cheesecake — serving context", ar: "جيلي تشيز كيك — سياق التقديم" },
      ],
    },
    fallbackInitials: "JC",
    visualGradient: "from-[#E7C97A] via-[#7A1128] to-[#5A0016]",
    menuCategory: "cakes",
    sizes: [
      {
        id: "bento",
        label: { en: "Bento", ar: "بنتو" },
        serves: { en: "Serves 2", ar: "تكفي 2" },
        priceOmr: 5.5,
      },
      {
        id: "medium-round",
        label: { en: "Medium Round", ar: "دائري وسط" },
        serves: { en: "Serves 6-8", ar: "تكفي 6-8" },
        priceOmr: 14,
      },
      {
        id: "large-round",
        label: { en: "Large Round", ar: "دائري كبير" },
        serves: { en: "Serves 10-12", ar: "تكفي 10-12" },
        priceOmr: 22,
      },
    ],
  },
];
