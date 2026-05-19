import { OrderPageContent } from "@/components/order-page-content";
import { listOrderableStorefrontProducts } from "@/lib/storefront/storefront-products";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  searchParams: Promise<{ product?: string; size?: string }>;
};

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const resolvedSearchParams = await searchParams;
  const orderableProducts = await listOrderableStorefrontProducts();

  return (
    <OrderPageContent
      initialProductId={resolvedSearchParams.product}
      initialSizeId={resolvedSearchParams.size}
      orderableProducts={orderableProducts}
    />
  );
}
