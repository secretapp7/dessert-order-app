import { brand } from "@/config/brand";
import { FULFILLMENT, type FulfillmentMethod } from "@/config/fulfillment";
import type { AppLanguage } from "@/config/translations";
import { translations } from "@/config/translations";
import { formatNeededDate } from "./format-needed-date";
import { isHttpsOrHttpUrl } from "./http-url";
import type { GpsLike } from "./location-rules";

export type WhatsappOrderFormLike = {
  customerName: string;
  phoneNumber: string;
  productId: string;
  sizeId: string;
  quantity: number;
  dateNeeded: string;
  fulfillmentMethod: FulfillmentMethod;
  mapsLinkPasted: string;
  addressDetails: string;
  notes: string;
};

/**
 * Mirrors the storefront WhatsApp outline (same copy source as before); used on the client after submit
 * and on the server to persist `Order.whatsappMessage`.
 */
export function buildWhatsappOrderLines(opts: {
  language: AppLanguage;
  form: WhatsappOrderFormLike;
  gps: GpsLike | null;
  dessertName: string;
  sizeLine: string;
  qty: number;
  estimated: number;
}): string[] {
  const wt = translations[opts.language].whatsappOrder;
  const biz = translations[opts.language].businessNotes;
  const none = wt.none;
  const delivery = opts.form.fulfillmentMethod === FULFILLMENT.DELIVERY;

  const tForm = translations[opts.language].form;
  const fulfillmentLabel = delivery ? tForm.fulfillmentOptions.delivery : tForm.fulfillmentOptions.pickup;

  const lines: string[] = [
    wt.title,
    "",
    wt.customerDetails,
    `${wt.labelName}: ${opts.form.customerName.trim() || none}`,
    `${wt.labelPhone}: ${opts.form.phoneNumber.trim() || none}`,
    "",
    wt.orderDetails,
    `${wt.labelDessert}: ${opts.dessertName}`,
    `${wt.labelSize}: ${opts.sizeLine}`,
    `${wt.labelQuantity}: ${opts.qty}`,
    `${wt.labelDateNeeded}: ${formatNeededDate(opts.language, opts.form.dateNeeded) || none}`,
    `${wt.labelOrderType}: ${fulfillmentLabel}`,
  ];

  if (opts.form.fulfillmentMethod === FULFILLMENT.PICKUP) {
    lines.push("", wt.pickupNote);
  } else {
    const linkLines: string[] = [];
    if (opts.gps) {
      linkLines.push(`${wt.locationGpsPrefix} ${opts.gps.mapsUrl}`);
    }
    const pasted = opts.form.mapsLinkPasted.trim();
    if (pasted && isHttpsOrHttpUrl(pasted)) {
      linkLines.push(`${wt.locationPastedPrefix} ${pasted}`);
    }
    const mergedLinks = linkLines.length > 0 ? linkLines.join("\n") : none;
    lines.push(
      "",
      wt.deliveryDetails,
      `${wt.labelLocationLink}:`,
      mergedLinks,
      "",
      `${wt.labelAddressDetails}: ${opts.form.addressDetails.trim() || none}`,
    );
  }

  lines.push(
    "",
    `${wt.labelNotes}: ${opts.form.notes.trim() || none}`,
    "",
    biz.preorder24h,
  );

  if (delivery) {
    lines.push("", biz.deliveryFeeWhatsApp);
  }

  lines.push(
    "",
    biz.paymentWhatsApp,
    "",
    `${wt.labelDessertSubtotal}: ${opts.estimated.toFixed(2)} ${brand.currency}`,
  );

  return lines;
}

export function joinWhatsappMessage(lines: string[]): string {
  return lines.join("\n");
}
