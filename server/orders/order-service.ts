import "server-only";

import crypto from "node:crypto";

import type { FulfillmentMethod } from "@/config/fulfillment";
import { FULFILLMENT } from "@/config/fulfillment";
import { getPublicBusinessSettings } from "@/lib/settings/public-settings";
import { resolveWhatsappNumber } from "@/lib/settings/public-settings-types";
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
import { assertDateCanAcceptOrder } from "@/lib/availability/availability-service";
import { OrderAvailabilityBlockedError } from "@/lib/availability/order-availability-error";
import { OrderCatalogNotAvailableError } from "@/lib/storefront/order-catalog-error";

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

function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
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

type ResolvedCatalogLine = {
  productDbId: string | null;
  productSizeDbId: string | null;
  productNameEn: string;
  productNameAr: string;
  sizeLabelEn: string;
  sizeLabelAr: string;
  unitPriceOmrNum: number;
  estimatedUnitCostOmrNum: number;
  productSlug: string;
  sizePublicId: string;
};

async function resolveCatalogLine(input: CreateOrderPayload): Promise<ResolvedCatalogLine> {
  const productSlug = input.productId.trim();
  const sizePublicId = input.productSizeId.trim();

  const dbProduct = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: {
      sizes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (dbProduct) {
    if (dbProduct.status !== "ACTIVE") {
      throw new OrderCatalogNotAvailableError();
    }

    const dbSize = dbProduct.sizes.find((s) => s.id === sizePublicId);
    if (!dbSize) {
      throw new OrderCatalogNotAvailableError();
    }

    const unitPriceOmrNum = decimalToNumber(dbSize.priceOmr);
    const estimatedUnitCostOmrNum =
      decimalToNumber(dbSize.ingredientCostOmr) +
      decimalToNumber(dbSize.packagingCostOmr) +
      decimalToNumber(dbSize.laborCostOmr);

    return {
      productDbId: dbProduct.id,
      productSizeDbId: dbSize.id,
      productNameEn: dbProduct.nameEn,
      productNameAr: dbProduct.nameAr,
      sizeLabelEn: `${dbSize.labelEn} (${dbSize.servesEn})`,
      sizeLabelAr: `${dbSize.labelAr} (${dbSize.servesAr})`,
      unitPriceOmrNum,
      estimatedUnitCostOmrNum,
      productSlug,
      sizePublicId,
    };
  }

  const staticProduct = staticProducts.find((p) => p.id === productSlug);
  const staticSize = staticProduct?.sizes.find((s) => s.id === sizePublicId);
  if (!staticProduct || !staticSize) {
    throw new OrderCatalogNotAvailableError();
  }

  const dbBySlug = await prisma.product.findUnique({
    where: { slug: productSlug },
    include: { sizes: { orderBy: { sortOrder: "asc" } } },
  });

  const productDbId: string | null = dbBySlug?.id ?? null;
  let productSizeDbId: string | null = null;

  if (dbBySlug?.sizes?.length) {
    const idx = staticProduct.sizes.findIndex((s) => s.id === sizePublicId);
    let dbSize = idx >= 0 ? dbBySlug.sizes[idx] : undefined;
    if (!dbSize) {
      dbSize = dbBySlug.sizes.find(
        (row) =>
          row.labelEn === staticSize.label.en &&
          row.servesEn === staticSize.serves.en &&
          decimalToNumber(row.priceOmr) === staticSize.priceOmr,
      );
    }
    if (dbSize) {
      productSizeDbId = dbSize.id;
    }
  }

  return {
    productDbId,
    productSizeDbId,
    productNameEn: staticProduct.name.en,
    productNameAr: staticProduct.name.ar,
    sizeLabelEn: `${staticSize.label.en} (${staticSize.serves.en})`,
    sizeLabelAr: `${staticSize.label.ar} (${staticSize.serves.ar})`,
    unitPriceOmrNum: staticSize.priceOmr,
    estimatedUnitCostOmrNum: 0,
    productSlug,
    sizePublicId,
  };
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
  const catalog = await resolveCatalogLine(input);

  const gate = await assertDateCanAcceptOrder(input.dateNeeded, input.quantity);
  if (!gate.ok) {
    throw new OrderAvailabilityBlockedError(gate.messageEn, gate.messageAr);
  }

  const dessertSubtotalOmrNum = catalog.unitPriceOmrNum * input.quantity;
  const unitPriceOmrNum = catalog.unitPriceOmrNum;
  const estimatedLineCostOmrNum = catalog.estimatedUnitCostOmrNum * input.quantity;
  const estimatedLineProfitOmrNum = dessertSubtotalOmrNum - estimatedLineCostOmrNum;

  const formLike: WhatsappOrderFormLike = {
    customerName: input.customerName,
    phoneNumber: input.customerPhone,
    productId: catalog.productSlug,
    sizeId: catalog.sizePublicId,
    quantity: input.quantity,
    dateNeeded: input.dateNeeded,
    fulfillmentMethod: input.fulfillmentMethod,
    mapsLinkPasted: input.mapsLinkPasted,
    addressDetails: input.addressDetails,
    notes: input.notes,
  };

  const lang = input.language as AppLanguage;

  const dessertName = lang === "ar" ? catalog.productNameAr : catalog.productNameEn;
  const sizeLine = lang === "ar" ? catalog.sizeLabelAr : catalog.sizeLabelEn;

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

  const publicSettings = await getPublicBusinessSettings();
  const normalizedPhone = resolveWhatsappNumber(publicSettings);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(whatsappMessage)}`;

  const publicId = await generateUniquePublicId();

  const phoneTrimmed = input.customerPhone.trim();
  const dessertSubtotalOmr = new Prisma.Decimal(dessertSubtotalOmrNum.toFixed(3));
  const totalOmr = dessertSubtotalOmr;
  const unitPriceOmr = new Prisma.Decimal(unitPriceOmrNum.toFixed(3));
  const lineTotalOmr = dessertSubtotalOmr;
  const estimatedUnitCostOmr = new Prisma.Decimal(catalog.estimatedUnitCostOmrNum.toFixed(3));
  const estimatedLineProfitOmr = new Prisma.Decimal(estimatedLineProfitOmrNum.toFixed(3));

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
              productId: catalog.productDbId,
              productSizeId: catalog.productSizeDbId,
              productNameEn: catalog.productNameEn,
              productNameAr: catalog.productNameAr,
              sizeLabelEn: catalog.sizeLabelEn,
              sizeLabelAr: catalog.sizeLabelAr,
              quantity: input.quantity,
              unitPriceOmr,
              lineTotalOmr,
              estimatedUnitCostOmr,
              estimatedLineProfitOmr,
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
