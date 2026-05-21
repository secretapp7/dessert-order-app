/** Public site origin for review links and share URLs (no trailing slash). */
export function getPublicSiteUrl(fallbackOrigin?: string | null): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const origin = fallbackOrigin?.trim().replace(/\/+$/, "");
  if (origin) return origin;
  return "http://localhost:3000";
}
