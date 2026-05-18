import "server-only";

import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function utcMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

function orderInMonthNotCancelled(start: Date, end: Date): Prisma.OrderWhereInput {
  return {
    createdAt: { gte: start, lte: end },
    orderStatus: { not: OrderStatus.CANCELLED },
  };
}

/** Dashboard + profit page share the same month window (UTC calendar month). */
export async function getMonthProfitBriefUtc() {
  const { start, end } = utcMonthRange();
  const orderWhere = orderInMonthNotCancelled(start, end);

  const [revAgg, deliAgg, expAgg, unpaid, itemsCost] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalOmr: true, dessertSubtotalOmr: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { deliveryFeeOmr: true },
    }),
    prisma.expense.aggregate({
      where: { voidedAt: null, expenseDate: { gte: start, lte: end } },
      _sum: { amountOmr: true },
    }),
    prisma.order.count({
      where: {
        ...orderWhere,
        paymentStatus: PaymentStatus.UNPAID,
      },
    }),
    prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      select: {
        quantity: true,
        estimatedUnitCostOmr: true,
        estimatedLineProfitOmr: true,
      },
    }),
  ]);

  let estimatedCogs = 0;
  let estimatedLineProfit = 0;
  let suspiciousZeroCost = false;
  for (const row of itemsCost) {
    const q = row.quantity;
    const unitCost = Number(row.estimatedUnitCostOmr);
    estimatedCogs += q * unitCost;
    estimatedLineProfit += Number(row.estimatedLineProfitOmr);
    if (unitCost === 0 && q > 0) suspiciousZeroCost = true;
  }

  const revenue = Number(revAgg._sum.totalOmr ?? 0);
  const dessertRevenue = Number(revAgg._sum.dessertSubtotalOmr ?? 0);
  const deliveryFees = Number(deliAgg._sum.deliveryFeeOmr ?? 0);
  const expensesTotal = Number(expAgg._sum.amountOmr ?? 0);

  const estimatedGrossProfit = revenue - estimatedCogs;
  const estimatedNetProfit = estimatedGrossProfit - expensesTotal;
  const marginPct = revenue > 0 ? ((estimatedNetProfit / revenue) * 100).toFixed(2) : null;

  return {
    monthLabel: start.toISOString().slice(0, 7),
    monthStart: start,
    monthEnd: end,
    revenue,
    dessertRevenue,
    deliveryFees,
    expensesTotal,
    estimatedCogs,
    estimatedLineProfitSum: estimatedLineProfit,
    estimatedGrossProfit,
    estimatedNetProfit,
    marginPct,
    suspiciousZeroCost,
    ordersCount: revAgg._count,
    unpaidCount: unpaid,
  };
}

export type ProfitReportUtcMonth = Awaited<ReturnType<typeof getProfitReportUtcMonth>>;

export async function getProfitReportUtcMonth() {
  const brief = await getMonthProfitBriefUtc();
  const { start, end } = utcMonthRange();
  const orderWhere = orderInMonthNotCancelled(start, end);

  const [delivered, topLines, cats, ordersList, expenseRows] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: start, lte: end }, orderStatus: OrderStatus.DELIVERED },
    }),
    prisma.orderItem.groupBy({
      where: { AND: [{ productId: { not: null } }, { order: orderWhere }] },
      by: ["productId"],
      _sum: { quantity: true, lineTotalOmr: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 15,
    }),
    prisma.expense.groupBy({
      where: { voidedAt: null, expenseDate: { gte: start, lte: end } },
      by: ["category"],
      _sum: { amountOmr: true },
      orderBy: { category: "asc" },
    }),
    prisma.order.findMany({
      where: orderWhere,
      select: { createdAt: true, totalOmr: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { voidedAt: null, expenseDate: { gte: start, lte: end } },
      select: { expenseDate: true, amountOmr: true },
      orderBy: { expenseDate: "asc" },
    }),
  ]);

  const topProducts = await Promise.all(
    topLines.map(async (row) => {
      if (!row.productId) return { id: "", nameEn: "—", nameAr: "", qty: 0, revenue: 0 };
      const p = await prisma.product.findUnique({
        where: { id: row.productId },
        select: { nameEn: true, nameAr: true },
      });
      return {
        id: row.productId,
        nameEn: p?.nameEn ?? "(unlinked)",
        nameAr: p?.nameAr ?? "",
        qty: row._sum.quantity ?? 0,
        revenue: Number(row._sum.lineTotalOmr ?? 0),
      };
    }),
  );

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const revenueByDay: Record<string, number> = {};
  for (const o of ordersList) {
    const k = dayKey(o.createdAt);
    revenueByDay[k] = (revenueByDay[k] ?? 0) + Number(o.totalOmr);
  }

  const expenseByDay: Record<string, number> = {};
  for (const e of expenseRows) {
    const raw = new Date(e.expenseDate).toISOString().slice(0, 10);
    expenseByDay[raw] = (expenseByDay[raw] ?? 0) + Number(e.amountOmr);
  }

  const daysInMonth: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    daysInMonth.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return {
    ...brief,
    deliveredCount: delivered,
    expenseByCategory: cats.map((c) => ({
      category: c.category,
      sum: Number(c._sum.amountOmr ?? 0),
    })),
    topProducts: topProducts.filter((x) => x.qty > 0),
    dailyRevenue: daysInMonth.map((d) => ({ day: d, amount: revenueByDay[d] ?? 0 })),
    dailyExpenses: daysInMonth.map((d) => ({ day: d, amount: expenseByDay[d] ?? 0 })),
  };
}
