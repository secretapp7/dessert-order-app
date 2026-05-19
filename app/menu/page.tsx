import { MenuPageClient } from "@/components/menu/menu-page-client";
import { getFeaturedHomeOffer } from "@/lib/storefront/storefront-offers";
import { getStorefrontMenuData } from "@/lib/storefront/storefront-products";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [{ products, categoryIds }, homeOffer] = await Promise.all([
    getStorefrontMenuData(),
    getFeaturedHomeOffer(),
  ]);

  return (
    <MenuPageClient products={products} categoryIds={categoryIds} homeOffer={homeOffer} />
  );
}
