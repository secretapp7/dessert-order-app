import { OrderPageContent } from "@/components/order-page-content";

type OrderPageProps = {
  searchParams: Promise<{ product?: string; size?: string }>;
};

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <OrderPageContent
      initialProductId={resolvedSearchParams.product}
      initialSizeId={resolvedSearchParams.size}
    />
  );
}
