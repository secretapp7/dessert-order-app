export type ProductSize = {
  label: string;
  serves: string;
  priceOmr: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  badge: "Signature" | "Popular";
  visualGradient: string;
  icon: string;
  sizes: ProductSize[];
};

export const products: Product[] = [
  {
    id: "tiramisu",
    name: "Tiramisu",
    description:
      "Silky mascarpone layers, espresso-soaked ladyfingers, and a dusting of cocoa.",
    badge: "Signature",
    visualGradient: "from-[#a97b5d] via-[#81553f] to-[#4b2e21]",
    icon: "TI",
    sizes: [
      { label: "Mini Tray", serves: "Serves 2-3", priceOmr: 6.5 },
      { label: "Classic Tray", serves: "Serves 5-6", priceOmr: 12 },
      { label: "Party Tray", serves: "Serves 10-12", priceOmr: 21 },
    ],
  },
  {
    id: "jelly-cheesecake",
    name: "Jelly Cheesecake",
    description:
      "Creamy baked-style cheesecake with a glossy jelly topping and buttery biscuit base.",
    badge: "Popular",
    visualGradient: "from-[#f2bbbf] via-[#e58f9b] to-[#b56772]",
    icon: "JC",
    sizes: [
      { label: "Bento", serves: "Serves 2", priceOmr: 5.5 },
      { label: "Medium Round", serves: "Serves 6-8", priceOmr: 14 },
      { label: "Large Round", serves: "Serves 10-12", priceOmr: 22 },
    ],
  },
];
