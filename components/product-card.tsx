"use client";

import type { Product } from "@/data/products";
import { brand } from "@/config/brand";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const startingPrice = Math.min(...product.sizes.map((size) => size.priceOmr));

  function selectDessert() {
    window.dispatchEvent(
      new CustomEvent("dessert:selected", {
        detail: { productId: product.id },
      }),
    );

    const orderSection = document.getElementById("order-form");
    orderSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-[#dbc6b0] bg-[#fff8f1] shadow-[0_14px_30px_-18px_rgba(73,49,34,0.6)]">
      <div className="relative p-4 sm:p-5">
        <div
          className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${product.visualGradient} opacity-90`}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="rounded-xl bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f4f58]">
            {product.badge}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-xs font-bold text-[#5a3829]">
            {product.icon}
          </div>
        </div>
        <div className="relative mt-6 space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-[#4b2e21]">
            {product.name}
          </h3>
          <p className="text-sm leading-relaxed text-[#7a5f4e]">{product.description}</p>
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-[#fff1e4] p-4 sm:mx-5 sm:mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9f7a52]">
          Sizes and pricing
        </p>
        <ul className="mt-2 space-y-2 text-sm text-[#5e4536]">
          {product.sizes.map((size) => (
            <li
              key={`${product.id}-${size.label}`}
              className="grid grid-cols-[1fr_auto] items-start gap-2 rounded-xl bg-[#fff8f1] px-3 py-2"
            >
              <div>
                <p className="font-medium text-[#5a3829]">{size.label}</p>
                <p className="text-xs text-[#7e624f]">{size.serves}</p>
              </div>
              <p className="font-semibold text-[#4b2e21]">
                {size.priceOmr.toFixed(2)} {brand.currency}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pb-5 sm:px-5">
        <p className="text-sm font-medium text-[#4b2e21]">
          Starting from{" "}
          <span className="text-base font-semibold">
            {startingPrice.toFixed(2)} {brand.currency}
          </span>
        </p>
        <button
          type="button"
          onClick={selectDessert}
          className="inline-flex min-h-10 items-center rounded-full bg-[#4b2e21] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#fff7ee]"
        >
          Select this dessert
        </button>
      </div>
    </article>
  );
}
