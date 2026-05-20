"use client";

import { AppShell } from "@/components/app-shell";
import { ScreenEnter } from "@/components/motion/screen-enter";
import { OrderForm } from "@/components/order-form";
import { useAppLanguage } from "@/components/language-provider";
import type { StorefrontProduct } from "@/lib/storefront/types";

type OrderPageContentProps = {
  initialProductId?: string;
  initialSizeId?: string;
  orderableProducts: StorefrontProduct[];
};

export function OrderPageContent({
  initialProductId,
  initialSizeId,
  orderableProducts,
}: OrderPageContentProps) {
  const { language } = useAppLanguage();

  return (
    <AppShell>
      <ScreenEnter className="pb-2 pt-1">
        <OrderForm
          key={`${initialProductId ?? "x"}-${initialSizeId ?? "x"}-${orderableProducts.length}`}
          language={language}
          initialProductId={initialProductId}
          initialSizeId={initialSizeId}
          orderableProducts={orderableProducts}
        />
      </ScreenEnter>
    </AppShell>
  );
}