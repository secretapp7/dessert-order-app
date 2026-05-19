import { HomePageClient } from "@/components/home/home-page-client";
import { getStorefrontHomeData } from "@/lib/storefront/storefront-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const homeData = await getStorefrontHomeData();
  return <HomePageClient {...homeData} />;
}
