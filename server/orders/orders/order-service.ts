import "server-only";

import crypto from "node:crypto";

import type { FulfillmentMethod } from "@/config/fulfillment";
import { FULFILLMENT } from "@/config/fulfillment";
import { brand } from "@/config/brand";
import type { AppLanguage } from "@/config/translations";
import { products as staticProducts } from "@/data/products";
import { prisma } from "@/lib/db/prisma";
import {
  buildWhatsappOrderLines,
  joinWhatsappMessage,
  type WhatsappOrderFormLike,
} from "@/lib/orders/build-whatsapp-order-message";
import { isHttpsOrHttpUrl } from "@/lib/orders/http-url";
import type { GpsLike } from "@/lib/orders/location-rules";
import { Prisma } from "@prisma/client";

import type { CreateOrderPayload } from "./order-validation";

function prismaFulfillment(form: FulfillmentMethod): "PICKUP" | "DELIVERY" {
  return form === FULFILLMENT.PICKUP ? "PICKUP" : "DELIVERY";
}

function prismaLanguage(lang: AppLanguage): "EN" | "AR" {
  return lang === "ar" ? "AR" : "EN";
}

function prismaDateUtc(isoDay: string): Date {
  const [yStr, moStr, dStr] = isoDay.split("-");
  const y = Number(yStr);
  const m = Number(moStr);
  const d = Number(dStr);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatPublicCandidate(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `CT-${y}${m}${d}-${suffix}`;
}

async function generateUniquePublicId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = formatPublicCandidate();
    const clash = await prisma.order.findUnique({ where: { publicId: candidate } });
    if (!clash) return candidate;
  }
  throw new Error("PUBLIC_ID_ALLOCATION_FAILED");
}

function orderMapsLink(data: CreateOrderPayload): string | null {
  if (data.fulfillmentMethod !== FULFILLMENT.DELIVERY) return null;
  const pasted = data.mapsLinkPasted.trim();
  if (pasted && isHttpsOrHttpUrl(pasted)) return pasted;
  if (data.gps?.mapsUrl) return data.gps.mapsUrl;
  return null;
}

async function resolveDbProductSizeIds(
  staticProductSlug: string,
  staticSizeId: string,
): Promise<{ productDbId: string; productSizeDbId: string }> {
  const staticProduct = staticProducts.find((p) => p.id === staticProductSlug);
  const staticSize = staticProduct?.sizes.find((s) => s.id === staticSizeId);
  if (!staticProduct || !staticSize) {
    throw new Error("STATIC_PRODUCT_NOT_FOUND");
  }

  const dbProduct = await prisma.product.findUnique({
    where: { slug: staticProductSlug },
    include: { sizes: { orderBy: { sortOrder: "asc" } } },
  });

  if (!dbProduct?.sizes?.length) {
    throw new Error("DB_PRODUCT_NOT_FOUND");
  }

  const idx = staticProduct.sizes.findIndex((s) => s.id === staticSizeId);
  let dbSize =
    idx >= 0 ? dbProduct.sizes[idx] : undefined;

  if (!dbSize) {
    dbSize = dbProduct.sizes.find(
      (row) =>
        row.labelEn === staticSize.label.en &&
        row.servesEn === staticSize.serves.en &&
        Number(row.priceOmr) === staticSize.priceOmr,
    );
  }

  if (!dbSize) {
    throw new Error("DB_PRODUCT_SIZE_NOT_FOUND");
  }

  return { productDbId: dbProduct.id, productSizeDbId: dbSize.id };
}

async function upsertCustomerByPhone(
  tx: Prisma.TransactionClient,
  name: string,
  phoneTrimmed: string,
) {
  const existing = await tx.customer.findFirst({ where: { phone: phoneTrimmed } });
  if (existing) {
    await tx.customer.update({
      where: { id: existing.id },
      data: { name: name.trim() },
    });
    return existing.id;
  }
  const created = await tx.customer.create({
    data: { name: name.trim(), phone: phoneTrimmed },
  });
  return created.id;
}

export async function persistOrder(input: CreateOrderPayload): Promise<{
  orderId: string;
  publicId: string;
  whatsappMessage: string;
  whatsappUrl: string;
}> {
  const staticProduct = staticProducts.find((p) => p.id === input.productId);
  const staticSize = staticProduct?.sizes.find((s) => s.id === input.productSizeId);
  if (!staticProduct || !staticSize) {
    throw new Error("STATIC_PRODUCT_NOT_FOUND");
  }

  const dessertSubtotalOmrNum = staticSize.priceOmr * input.quantity;
  const unitPriceOmrNum = staticSize.priceOmr;

  const { productDbId, productSizeDbId } = await resolveDbProductSizeIds(
    input.productId,
    input.productSizeId,
  );

  const formLike: WhatsappOrderFormLike = {
    customerName: input.customerName,
    phoneNumber: input.customerPhone,
    productId: input.productId,
    sizeId: input.productSizeId,
    quantity: input.quantity,
    dateNeeded: input.dateNeeded,
    fulfillmentMethod: input.fulfillmentMethod,
    mapsLinkPasted: input.mapsLinkPasted,
    addressDetails: input.addressDetails,
    notes: input.notes,
  };

  const lang = input.language as AppLanguage;

  const dessertName = staticProduct.name[lang];
  const sizeLine = `${staticSize.label[lang]} (${staticSize.serves[lang]})`;

  let gpsPayload: GpsLike | null = null;
  if (input.fulfillmentMethod === FULFILLMENT.DELIVERY && input.gps) {
    gpsPayload = {
      lat: input.gps.lat,
      lng: input.gps.lng,
      accuracyM:
        typeof input.gps.accuracyM === "number" && Number.isFinite(input.gps.accuracyM)
          ? Math.round(input.gps.accuracyM)
          : undefined,
      mapsUrl: input.gps.mapsUrl,
    };
  }

  const lines = buildWhatsappOrderLines({
    language: lang,
    form: formLike,
    gps: input.fulfillmentMethod === FULFILLMENT.DELIVERY ? gpsPayload : null,
    dessertName,
    sizeLine,
    qty: input.quantity,
    estimated: dessertSubtotalOmrNum,
  });
  const whatsappMessage = joinWhatsappMessage(lines);

  const normalizedPhone = brand.whatsappNumber.replace(/\D/g, "");
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(whatsappMessage)}`;

  const publicId = await generateUniquePublicId();

  const phoneTrimmed = input.customerPhone.trim();
  const dessertSubtotalOmr = new Prisma.Decimal(dessertSubtotalOmrNum.toFixed(3));
  const totalOmr = dessertSubtotalOmr;
  const unitPriceOmr = new Prisma.Decimal(unitPriceOmrNum.toFixed(3));
  const lineTotalOmr = dessertSubtotalOmr;

  const dateNeededDb = prismaDateUtc(input.dateNeeded);

  const deliveryStatus =
    input.fulfillmentMethod === FULFILLMENT.DELIVERY ? "PENDING" : "NONE";

  const mapsLinkDb = orderMapsLink(input);

  let gpsLatitude: Prisma.Decimal | null = null;
  let gpsLongitude: Prisma.Decimal | null = null;
  let gpsAccuracy: Prisma.Decimal | null = null;
  if (
    input.fulfillmentMethod === FULFILLMENT.DELIVERY &&
    gpsPayload !== null &&
    Number.isFinite(gpsPayload.lat) &&
    Number.isFinite(gpsPayload.lng)
  ) {
    gpsLatitude = new Prisma.Decimal(Number(gpsPayload.lat.toFixed(7)));
    gpsLongitude = new Prisma.Decimal(Number(gpsPayload.lng.toFixed(7)));
    if (
      gpsPayload.accuracyM !== undefined &&
      Number.isFinite(gpsPayload.accuracyM)
    ) {
      gpsAccuracy = new Prisma.Decimal(Number(gpsPayload.accuracyM.toFixed(3)));
    }
  }

  const addr =
    input.fulfillmentMethod === FULFILLMENT.DELIVERY
      ? input.addressDetails.trim()
      : null;

  const orderRow = await prisma.$transaction(async (tx) => {
    const customerId = await upsertCustomerByPhone(
      tx,
      input.customerName,
      phoneTrimmed,
    );

    const orderRecord = await tx.order.create({
      data: {
        publicId,
        customerId,
        customerName: input.customerName.trim(),
        customerPhone: phoneTrimmed,
        language: prismaLanguage(lang),
        fulfillmentMethod: prismaFulfillment(input.fulfillmentMethod),
        orderStatus: "NEW",
        deliveryStatus,
        paymentStatus: "UNPAID",
        dateNeeded: dateNeededDb,
        notes: input.notes.trim() ? input.notes.trim() : null,
        mapsLink: mapsLinkDb,
        gpsLatitude,
        gpsLongitude,
        gpsAccuracy,
        addressDetails: addr?.length ? addr : null,
        dessertSubtotalOmr,
        deliveryFeeOmr: null,
        totalOmr,
        whatsappMessage,
        items: {
          create: [
            {
              productId: productDbId,
              productSizeId: productSizeDbId,
              productNameEn: staticProduct.name.en,
              productNameAr: staticProduct.name.ar,
              sizeLabelEn: `${staticSize.label.en} (${staticSize.serves.en})`,
              sizeLabelAr: `${staticSize.label.ar} (${staticSize.serves.ar})`,
              quantity: input.quantity,
              unitPriceOmr,
              lineTotalOmr,
            },
          ],
        },
      },
    });

    return orderRecord;
  });

  return {
    orderId: orderRow.id,
    publicId,
    whatsappMessage,
    whatsappUrl,
  };
}
