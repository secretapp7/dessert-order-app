import { z } from "zod";

import { FULFILLMENT } from "@/config/fulfillment";
import { isHttpsOrHttpUrl } from "@/lib/orders/http-url";
import {
  hasDeliveryLocationMethod,
  normalizeAddressTrimLength,
} from "@/lib/orders/location-rules";

export const createOrderPayloadSchema = z
  .object({
    customerName: z.string().trim().min(2, "NAME_REQUIRED"),
    customerPhone: z.string().trim().min(1, "PHONE_REQUIRED"),
    productId: z.string().trim().min(1, "PRODUCT_REQUIRED"),
    productSizeId: z.string().trim().min(1, "SIZE_REQUIRED"),
    quantity: z.coerce.number().int().min(1, "QUANTITY_INVALID"),
    dateNeeded: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "DATE_INVALID"),
    fulfillmentMethod: z.enum([FULFILLMENT.PICKUP, FULFILLMENT.DELIVERY]),
    mapsLinkPasted: z.string().optional().default(""),
    addressDetails: z.string().optional().default(""),
    notes: z.string().optional().default(""),
    language: z.enum(["en", "ar"]),
    gps:
      z
        .object({
          lat: z.number().finite(),
          lng: z.number().finite(),
          accuracyM: z.number().finite().optional(),
          mapsUrl: z.string().min(1),
        })
        .optional()
        .nullable(),
  })
  .superRefine((data, ctx) => {
    const cleanedPhone = data.customerPhone.replace(/[^\d+]/g, "");
    if (!/^\+?\d{8,15}$/.test(cleanedPhone)) {
      ctx.addIssue({ code: "custom", message: "PHONE_INVALID" });
    }

    const pasteTrimmed = data.mapsLinkPasted.trim();

    if (data.fulfillmentMethod === FULFILLMENT.DELIVERY) {
      const addressTrim = data.addressDetails.trim();

      if (!normalizeAddressTrimLength(data.addressDetails)) {
        ctx.addIssue({ code: "custom", message: "ADDRESS_TOO_SHORT" });
      }

      if (pasteTrimmed && !isHttpsOrHttpUrl(pasteTrimmed)) {
        ctx.addIssue({ code: "custom", message: "MAPS_LINK_INVALID" });
      }

      if (
        !hasDeliveryLocationMethod({
          gps: data.gps ?? null,
          mapsPaste: data.mapsLinkPasted,
          address: addressTrim,
        })
      ) {
        ctx.addIssue({ code: "custom", message: "DELIVERY_LOCATION_METHOD" });
      }
    }

    const dateParts = data.dateNeeded.split("-").map((p) => Number(p));
    const [y, m, day] = dateParts;
    if (!y || !m || !day) {
      ctx.addIssue({ code: "custom", message: "DATE_INVALID" });
      return;
    }
    const dt = Date.UTC(y, m - 1, day);
    if (Number.isNaN(dt)) ctx.addIssue({ code: "custom", message: "DATE_INVALID" });
  });

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
