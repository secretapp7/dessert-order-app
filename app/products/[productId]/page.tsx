import { AppShell } from "@/components/app-shell";
import { ProductDetailClient } from "@/components/products/product-detail-client";
import { getStorefrontProductBySlug } from "@/lib/storefront/storefront-products";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getStorefrontProductBySlug(productId);

  return (
    <AppShell>
      <ProductDetailClient key={productId} product={product} />
    </AppShell>
  );
}
