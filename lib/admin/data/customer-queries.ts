import "server-only";

import {
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
  Prisma,
  type ReviewStatus,
} from "@prisma/client";

import { dateToIsoOrNull, dateToUtcYmd } from "@/lib/admin/admin-serialize";
import { prisma } from "@/lib/db/prisma";

function dec(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type CustomerListFilter = "all" | "repeat" | "vip" | "unpaid" | "blocked";
export type CustomerListSort = "newest" | "orders" | "spent" | "last_order";

export type CustomerListFilters = {
  q?: string;
  filter?: CustomerListFilter;
  sort?: CustomerListSort;
  page?: number;
  pageSize?: number;
};

export type CustomerListRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isVip: boolean;
  isBlocked: boolean;
  totalOrders: number;
  totalSpentOmr: number;
  unpaidTotalOmr: number;
  lastOrderDateIso: string | null;
  favoriteProduct: string | null;
  reviewCount: number;
  createdAtIso: string;
};

export type CustomerAdminRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  internalNote: string | null;
  tags: string | null;
  preferredLanguage: string | null;
  lastContactedAtIso: string | null;
  isVip: boolean;
  isBlocked: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

export type CustomerStats = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSpentOmr: number;
  unpaidTotalOmr: number;
  unpaidOrderCount: number;
  averageOrderValueOmr: number;
  favoriteProduct: string | null;
  favoriteSize: string | null;
  pickupCount: number;
  deliveryCount: number;
  lastOrderDateIso: string | null;
  lastReviewStatus: string | null;
  lastReviewRating: number | null;
  lastReviewDateIso: string | null;
  latestOrderLanguage: "EN" | "AR" | null;
  lastDeliveredOrderId: string | null;
  lastDeliveredOrderPublicId: string | null;
  lastDeliveredReviewUrl: string | null;
};

export type CustomerOrderHistoryRow = {
  id: string;
  publicId: string;
  dateNeededIso: string;
  orderStatus: string;
  paymentStatus: string;
  fulfillmentMethod: string;
  totalOmr: number;
  createdAtIso: string;
};

export type CustomerProductPreferenceRow = {
  productName: string;
  sizeLabel: string;
  quantity: number;
  revenueOmr: number;
};

export type CustomerReviewHistoryRow = {
  id: string;
  rating: number;
  status: ReviewStatus;
  source: string | null;
  productName: string | null;
  reviewDateIso: string | null;
  createdAtIso: string;
};

export type RepeatCustomerInsights = {
  totalCustomers: number;
  repeatCustomerCount: number;
  customersWithUnpaidCount: number;
  topCustomerThisMonth: { id: string; name: string; spentOmr: number } | null;
};

export type CustomerReportInsight = {
  topBySpending: Array<{ id: string; name: string; spentOmr: number; orderCount: number }>;
  topRepeat: Array<{ id: string; name: string; orderCount: number; spentOmr: number }>;
  unpaidCustomers: Array<{ id: string; name: string; unpaidOmr: number; unpaidOrders: number }>;
};

type OrderAggRow = {
  customerId: string;
  orderCount: number;
  spentOmr: number;
  unpaidOmr: number;
  lastOrderAt: Date | null;
};

async function loadOrderAggregates(customerIds: string[]): Promise<Map<string, OrderAggRow>> {
  const map = new Map<string, OrderAggRow>();
  if (customerIds.length === 0) return map;

  const orders = await prisma.order.findMany({
    where: { customerId: { in: customerIds } },
    select: {
      customerId: true,
      orderStatus: true,
      paymentStatus: true,
      totalOmr: true,
      createdAt: true,
    },
  });

  for (const o of orders) {
    if (!o.customerId) continue;
    const row = map.get(o.customerId) ?? {
      customerId: o.customerId,
      orderCount: 0,
      spentOmr: 0,
      unpaidOmr: 0,
      lastOrderAt: null,
    };

    if (o.orderStatus !== OrderStatus.CANCELLED) {
      row.orderCount += 1;
      row.spentOmr += dec(o.totalOmr);
      if (o.paymentStatus === PaymentStatus.UNPAID) {
        row.unpaidOmr += dec(o.totalOmr);
      }
    }

    if (!row.lastOrderAt || o.createdAt > row.lastOrderAt) {
      row.lastOrderAt = o.createdAt;
    }

    map.set(o.customerId, row);
  }

  return map;
}

async function loadFavoriteProducts(customerIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (customerIds.length === 0) return out;

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        customerId: { in: customerIds },
        orderStatus: { not: OrderStatus.CANCELLED },
      },
    },
    select: {
      productNameEn: true,
      quantity: true,
      order: { select: { customerId: true } },
    },
  });

  const buckets = new Map<string, Map<string, number>>();
  for (const item of items) {
    const cid = item.order.customerId;
    if (!cid) continue;
    const productMap = buckets.get(cid) ?? new Map<string, number>();
    const key = item.productNameEn.trim() || "Unknown";
    productMap.set(key, (productMap.get(key) ?? 0) + item.quantity);
    buckets.set(cid, productMap);
  }

  for (const [cid, productMap] of buckets) {
    let best: string | null = null;
    let bestQty = 0;
    for (const [name, qty] of productMap) {
      if (qty > bestQty) {
        bestQty = qty;
        best = name;
      }
    }
    if (best) out.set(cid, best);
  }

  return out;
}

async function loadReviewCounts(names: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (unique.length === 0) return out;

  for (const name of unique) {
    const count = await prisma.review.count({
      where: { customerName: { equals: name, mode: "insensitive" } },
    });
    out.set(name.toLowerCase(), count);
  }
  return out;
}

function serializeCustomer(row: {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  internalNote: string | null;
  tags: string | null;
  preferredLanguage: string | null;
  lastContactedAt: Date | null;
  isVip: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CustomerAdminRecord {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    internalNote: row.internalNote,
    tags: row.tags,
    preferredLanguage: row.preferredLanguage,
    lastContactedAtIso: dateToIsoOrNull(row.lastContactedAt),
    isVip: row.isVip,
    isBlocked: row.isBlocked,
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
  };
}

export async function getCustomersForAdmin(filters: CustomerListFilters = {}) {
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const page = Math.max(1, filters.page ?? 1);
  const filter = filters.filter ?? "all";
  const sort = filters.sort ?? "newest";

  const where: Prisma.CustomerWhereInput = {};
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter === "vip") where.isVip = true;
  if (filter === "blocked") where.isBlocked = true;

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const ids = customers.map((c) => c.id);
  const aggMap = await loadOrderAggregates(ids);

  let rows: CustomerListRow[] = customers.map((c) => {
    const agg = aggMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      isVip: c.isVip,
      isBlocked: c.isBlocked,
      totalOrders: agg?.orderCount ?? 0,
      totalSpentOmr: agg?.spentOmr ?? 0,
      unpaidTotalOmr: agg?.unpaidOmr ?? 0,
      lastOrderDateIso: dateToIsoOrNull(agg?.lastOrderAt ?? null),
      favoriteProduct: null,
      reviewCount: 0,
      createdAtIso: c.createdAt.toISOString(),
    };
  });

  if (filter === "repeat") {
    rows = rows.filter((r) => r.totalOrders >= 2);
  }
  if (filter === "unpaid") {
    rows = rows.filter((r) => r.unpaidTotalOmr > 0);
  }

  rows.sort((a, b) => {
    switch (sort) {
      case "orders":
        return b.totalOrders - a.totalOrders || b.totalSpentOmr - a.totalSpentOmr;
      case "spent":
        return b.totalSpentOmr - a.totalSpentOmr || b.totalOrders - a.totalOrders;
      case "last_order": {
        const at = a.lastOrderDateIso ? Date.parse(a.lastOrderDateIso) : 0;
        const bt = b.lastOrderDateIso ? Date.parse(b.lastOrderDateIso) : 0;
        return bt - at;
      }
      case "newest":
      default:
        return Date.parse(b.createdAtIso) - Date.parse(a.createdAtIso);
    }
  });

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const slice = rows.slice((page - 1) * pageSize, page * pageSize);

  const pageIds = slice.map((r) => r.id);
  const [favorites, reviewCounts] = await Promise.all([
    loadFavoriteProducts(pageIds),
    loadReviewCounts(slice.map((r) => r.name)),
  ]);

  const enriched = slice.map((r) => ({
    ...r,
    favoriteProduct: favorites.get(r.id) ?? null,
    reviewCount: reviewCounts.get(r.name.toLowerCase()) ?? 0,
  }));

  return { rows: enriched, total, page, pageCount, pageSize };
}

export async function getCustomerForAdmin(id: string): Promise<CustomerAdminRecord | null> {
  const row = await prisma.customer.findUnique({ where: { id } });
  if (!row) return null;
  return serializeCustomer(row);
}

export async function getCustomerStats(id: string): Promise<CustomerStats | null> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return null;

  const orders = await prisma.order.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicId: true,
      orderStatus: true,
      paymentStatus: true,
      fulfillmentMethod: true,
      totalOmr: true,
      createdAt: true,
      language: true,
      reviewToken: true,
    },
  });

  let totalOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let totalSpentOmr = 0;
  let unpaidTotalOmr = 0;
  let unpaidOrderCount = 0;
  let pickupCount = 0;
  let deliveryCount = 0;
  let lastOrderDateIso: string | null = null;
  let latestOrderLanguage: "EN" | "AR" | null = null;
  let lastDeliveredOrderId: string | null = null;
  let lastDeliveredOrderPublicId: string | null = null;
  let lastDeliveredReviewUrl: string | null = null;

  for (const o of orders) {
    if (o.orderStatus === OrderStatus.CANCELLED) {
      cancelledOrders += 1;
      continue;
    }

    totalOrders += 1;
    totalSpentOmr += dec(o.totalOmr);

    if (o.orderStatus === OrderStatus.DELIVERED) {
      deliveredOrders += 1;
      if (!lastDeliveredOrderId) {
        lastDeliveredOrderId = o.id;
        lastDeliveredOrderPublicId = o.publicId;
        if (o.reviewToken) {
          lastDeliveredReviewUrl = `/review/${o.publicId}?token=${encodeURIComponent(o.reviewToken)}`;
        }
      }
    }

    if (o.paymentStatus === PaymentStatus.UNPAID) {
      unpaidTotalOmr += dec(o.totalOmr);
      unpaidOrderCount += 1;
    }

    if (o.fulfillmentMethod === FulfillmentMethod.PICKUP) pickupCount += 1;
    if (o.fulfillmentMethod === FulfillmentMethod.DELIVERY) deliveryCount += 1;

    if (!lastOrderDateIso) {
      lastOrderDateIso = o.createdAt.toISOString();
      latestOrderLanguage = o.language;
    }
  }

  const items = await prisma.orderItem.findMany({
    where: { order: { customerId: id, orderStatus: { not: OrderStatus.CANCELLED } } },
    select: { productNameEn: true, sizeLabelEn: true, quantity: true },
  });

  const productQty = new Map<string, { product: string; size: string; qty: number }>();
  for (const item of items) {
    const key = `${item.productNameEn}::${item.sizeLabelEn}`;
    const prev = productQty.get(key) ?? {
      product: item.productNameEn,
      size: item.sizeLabelEn,
      qty: 0,
    };
    prev.qty += item.quantity;
    productQty.set(key, prev);
  }

  let favoriteProduct: string | null = null;
  let favoriteSize: string | null = null;
  let bestQty = 0;
  for (const entry of productQty.values()) {
    if (entry.qty > bestQty) {
      bestQty = entry.qty;
      favoriteProduct = entry.product;
      favoriteSize = entry.size;
    }
  }

  const lastReview = await prisma.review.findFirst({
    where: { customerName: { equals: customer.name, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    select: { status: true, rating: true, reviewDate: true, createdAt: true },
  });

  const averageOrderValueOmr =
    totalOrders > 0 ? Math.round((totalSpentOmr / totalOrders) * 1000) / 1000 : 0;

  return {
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalSpentOmr,
    unpaidTotalOmr,
    unpaidOrderCount,
    averageOrderValueOmr,
    favoriteProduct,
    favoriteSize,
    pickupCount,
    deliveryCount,
    lastOrderDateIso,
    lastReviewStatus: lastReview?.status ?? null,
    lastReviewRating: lastReview?.rating ?? null,
    lastReviewDateIso: dateToIsoOrNull(lastReview?.reviewDate ?? lastReview?.createdAt ?? null),
    latestOrderLanguage,
    lastDeliveredOrderId,
    lastDeliveredOrderPublicId,
    lastDeliveredReviewUrl,
  };
}

export async function getCustomerOrderHistory(id: string): Promise<CustomerOrderHistoryRow[]> {
  const orders = await prisma.order.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      publicId: true,
      dateNeeded: true,
      orderStatus: true,
      paymentStatus: true,
      fulfillmentMethod: true,
      totalOmr: true,
      createdAt: true,
    },
  });

  return orders.map((o) => ({
    id: o.id,
    publicId: o.publicId,
    dateNeededIso: dateToUtcYmd(o.dateNeeded),
    orderStatus: o.orderStatus,
    paymentStatus: o.paymentStatus,
    fulfillmentMethod: o.fulfillmentMethod,
    totalOmr: dec(o.totalOmr),
    createdAtIso: o.createdAt.toISOString(),
  }));
}

export async function getCustomerProductPreferences(
  id: string,
): Promise<CustomerProductPreferenceRow[]> {
  const items = await prisma.orderItem.findMany({
    where: { order: { customerId: id, orderStatus: { not: OrderStatus.CANCELLED } } },
    select: {
      productNameEn: true,
      sizeLabelEn: true,
      quantity: true,
      lineTotalOmr: true,
    },
  });

  const map = new Map<string, CustomerProductPreferenceRow>();
  for (const item of items) {
    const key = `${item.productNameEn}::${item.sizeLabelEn}`;
    const prev = map.get(key) ?? {
      productName: item.productNameEn,
      sizeLabel: item.sizeLabelEn,
      quantity: 0,
      revenueOmr: 0,
    };
    prev.quantity += item.quantity;
    prev.revenueOmr += dec(item.lineTotalOmr);
    map.set(key, prev);
  }

  return [...map.values()].sort((a, b) => b.quantity - a.quantity || b.revenueOmr - a.revenueOmr);
}

export async function getCustomerReviewHistory(id: string): Promise<CustomerReviewHistoryRow[]> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!customer) return [];

  const reviews = await prisma.review.findMany({
    where: { customerName: { equals: customer.name, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { nameEn: true } } },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    status: r.status,
    source: r.source,
    productName: r.product?.nameEn ?? null,
    reviewDateIso: dateToIsoOrNull(r.reviewDate),
    createdAtIso: r.createdAt.toISOString(),
  }));
}

export async function getRepeatCustomerInsights(): Promise<RepeatCustomerInsights> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const [totalCustomers, customers, monthOrders] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.findMany({ select: { id: true, name: true } }),
    prisma.order.findMany({
      where: {
        customerId: { not: null },
        createdAt: { gte: monthStart, lte: monthEnd },
        orderStatus: { not: OrderStatus.CANCELLED },
      },
      select: { customerId: true, totalOmr: true },
    }),
  ]);

  const aggMap = await loadOrderAggregates(customers.map((c) => c.id));
  let repeatCustomerCount = 0;
  let customersWithUnpaidCount = 0;
  for (const agg of aggMap.values()) {
    if (agg.orderCount >= 2) repeatCustomerCount += 1;
    if (agg.unpaidOmr > 0) customersWithUnpaidCount += 1;
  }

  const monthSpend = new Map<string, number>();
  for (const o of monthOrders) {
    if (!o.customerId) continue;
    monthSpend.set(o.customerId, (monthSpend.get(o.customerId) ?? 0) + dec(o.totalOmr));
  }

  let topCustomerThisMonth: RepeatCustomerInsights["topCustomerThisMonth"] = null;
  for (const [cid, spent] of monthSpend) {
    if (!topCustomerThisMonth || spent > topCustomerThisMonth.spentOmr) {
      const c = customers.find((x) => x.id === cid);
      if (c) topCustomerThisMonth = { id: c.id, name: c.name, spentOmr: spent };
    }
  }

  return {
    totalCustomers,
    repeatCustomerCount,
    customersWithUnpaidCount,
    topCustomerThisMonth,
  };
}

export async function getCustomerReportInsights(limit = 5): Promise<CustomerReportInsight> {
  const customers = await prisma.customer.findMany({ select: { id: true, name: true } });
  const aggMap = await loadOrderAggregates(customers.map((c) => c.id));

  const rows = customers.map((c) => {
    const agg = aggMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      orderCount: agg?.orderCount ?? 0,
      spentOmr: agg?.spentOmr ?? 0,
      unpaidOmr: agg?.unpaidOmr ?? 0,
    };
  });

  const topBySpending = [...rows]
    .filter((r) => r.spentOmr > 0)
    .sort((a, b) => b.spentOmr - a.spentOmr)
    .slice(0, limit)
    .map((r) => ({ id: r.id, name: r.name, spentOmr: r.spentOmr, orderCount: r.orderCount }));

  const topRepeat = [...rows]
    .filter((r) => r.orderCount >= 2)
    .sort((a, b) => b.orderCount - a.orderCount || b.spentOmr - a.spentOmr)
    .slice(0, limit)
    .map((r) => ({ id: r.id, name: r.name, orderCount: r.orderCount, spentOmr: r.spentOmr }));

  const unpaidCustomers = [...rows]
    .filter((r) => r.unpaidOmr > 0)
    .sort((a, b) => b.unpaidOmr - a.unpaidOmr)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      name: r.name,
      unpaidOmr: r.unpaidOmr,
      unpaidOrders: r.orderCount,
    }));

  return { topBySpending, topRepeat, unpaidCustomers };
}
