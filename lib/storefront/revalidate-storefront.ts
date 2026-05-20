import "server-only";

import { revalidatePath } from "next/cache";

/** Revalidate public catalog pages after admin catalog changes. */
export function revalidateStorefrontPaths(productSlug?: string | null) {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/order");
  if (productSlug?.trim()) {
    revalidatePath(`/products/${productSlug.trim()}`);
  }
}
