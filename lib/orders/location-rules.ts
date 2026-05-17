import { ADDRESS_FALLBACK_WITHOUT_LINK_CHARS, ADDRESS_MIN_CHARS } from "./constants";
import { isHttpsOrHttpUrl } from "./http-url";

export type GpsLike = {
  lat: number;
  lng: number;
  accuracyM?: number | undefined;
  mapsUrl: string;
};

export function hasDeliveryLocationMethod(opts: {
  gps: GpsLike | null | undefined;
  mapsPaste: string;
  address: string;
}): boolean {
  if (opts.gps) return true;
  const paste = opts.mapsPaste.trim();
  if (paste && isHttpsOrHttpUrl(paste)) return true;
  return opts.address.trim().length >= ADDRESS_FALLBACK_WITHOUT_LINK_CHARS;
}

export function normalizeAddressTrimLength(addressDetails: string): boolean {
  return addressDetails.trim().length >= ADDRESS_MIN_CHARS;
}
