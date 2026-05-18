import "server-only";

import { FulfillmentMethod, OrderStatus, Prisma } from "@prisma/client";

import { getMonthProfitBriefUtc } from "@/lib/admin/data/profit-queries";
import { prisma } from "@/lib/db/prisma";

export function utcTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );
  return { start, end };
}

export function utcMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { start, end };
}

const pendingWorkflow: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

export async function getAdminDashboardSnapshot() {
  const { start: dayStart, end: dayEnd } = utcTodayRange();
  const { start: monthStart, end: monthEnd } = utcMonthRange();
  const monthOrderWhere = {
    createdAt: { gte: monthStart, lte: monthEnd },
    orderStatus: { not: OrderStatus.CANCELLED } as const,
  };

  const [
    ordersToday,
    pendingOrders,
    deliveredCount,
    cancelledCount,
    monthDessertSum,
    monthTotalSum,
    pickupMonth,
    deliveryMonth,
    bestGroup,
    recentOrders,
    profitBrief,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd },
        archivedAt: null,
      },
    }),
    prisma.order.count({
      where: { orderStatus: { in: pendingWorkflow }, archivedAt: null },
    }),
    prisma.order.count({ where: { orderStatus: OrderStatus.DELIVERED } }),
    prisma.order.count({ where: { orderStatus: OrderStatus.CANCELLED } }),
    prisma.order.aggregate({
      where: monthOrderWhere,
      _sum: { dessertSubtotalOmr: true },
    }),
    prisma.order.aggregate({
      where: monthOrderWhere,
      _sum: { totalOmr: true },
    }),
    prisma.order.count({
      where: {
        ...monthOrderWhere,
        fulfillmentMethod: FulfillmentMethod.PICKUP,
      },
    }),
    prisma.order.count({
      where: {
        ...monthOrderWhere,
        fulfillmentMethod: FulfillmentMethod.DELIVERY,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 1,
    }),
    prisma.order.findMany({
      take: 5,
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        publicId: true,
        customerName: true,
        orderStatus: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        totalOmr: true,
        createdAt: true,
      },
    }),
    getMonthProfitBriefUtc(),
  ]);

  let bestSeller: { label: string; units: number } | null = null;
  const top = bestGroup[0];
  if (top?.productId && top._sum.quantity != null) {
    const product = await prisma.product.findUnique({
      where: { id: top.productId },
      select: { nameEn: true },
    });
    if (product) {
      bestSeller = {
        label: product.nameEn,
        units: top._sum.quantity,
      };
    }
  }

  return {
    ordersToday,
    pendingOrders,
    deliveredCount,
    cancelledCount,
    monthDessertRevenue: Number(monthDessertSum._sum.dessertSubtotalOmr ?? 0),
    monthTotalRevenue: Number(monthTotalSum._sum.totalOmr ?? 0),
    pickupMonth,
    deliveryMonth,
    bestSeller,
    recentOrders,
    profitBrief,
  };
}

export type OrderListFilters = {
  orderStatus?: OrderStatus;
  fulfillmentMethod?: FulfillmentMethod;
  q?: string;
  /** Active = non-archived (default). Archived-only or all lists. */
  archive?: "active" | "archived" | "all";
  page: number;
  pageSize: number;
};

export async function getAdminOrdersList(filters: OrderListFilters) {
  const where: Prisma.OrderWhereInput = {};
  if (filters.orderStatus) {
    where.orderStatus = filters.orderStatus;
  }
  if (filters.fulfillmentMethod) {
    where.fulfillmentMethod = filters.fulfillmentMethod;
  }
  const arc = filters.archive ?? "active";
  if (arc === "archived") {
    where.archivedAt = { not: null };
  } else if (arc === "active") {
    where.archivedAt = null;
  }
  const rawQ = filters.q?.trim();
  if (rawQ) {
    where.OR = [
      { publicId: { contains: rawQ, mode: "insensitive" } },
      { customerName: { contains: rawQ, mode: "insensitive" } },
      { customerPhone: { contains: rawQ, mode: "insensitive" } },
    ];
  }

  const skip = (filters.page - 1) * filters.pageSize;

  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: filters.pageSize,
      select: {
        id: true,
        publicId: true,
        customerName: true,
        customerPhone: true,
        orderStatus: true,
        paymentStatus: true,
        fulfillmentMethod: true,
        deliveryStatus: true,
        dateNeeded: true,
        dessertSubtotalOmr: true,
        deliveryFeeOmr: true,
        totalOmr: true,
        createdAt: true,
        archivedAt: true,
      },
    }),
  ]);

  return { total, rows, pageCount: Math.max(1, Math.ceil(total / filters.pageSize)) };
}

export async function getAdminOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { orderBy: { createdAt: "asc" } },
    },
  });
}

export { OrderStatus, FulfillmentMethod } from "@prisma/client";
