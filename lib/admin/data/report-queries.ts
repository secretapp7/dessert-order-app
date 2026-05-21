import "server-only";

import {
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function dec(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function utcCurrentMonthLabel(): string {
  return new Date().toISOString().slice(0, 7);
}

export function utcRangeFromMonth(month: string): { start: Date; end: Date; label: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  if (mo < 0 || mo > 11) return null;
  const start = new Date(Date.UTC(y, mo, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo + 1, 0, 23, 59, 59, 999));
  return { start, end, label: `${m[1]}-${m[2]}` };
}

export function utcMonthRangeFor(month?: string): { start: Date; end: Date; label: string } {
  if (month) {
    const parsed = utcRangeFromMonth(month);
    if (parsed) return parsed;
  }
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end, label: start.toISOString().slice(0, 7) };
}

export function utcRangeFromYmd(startYmd: string, endYmd: string): { start: Date; end: Date } | null {
  const s = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startYmd.trim());
  const e = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endYmd.trim());
  if (!s || !e) return null;
  const start = new Date(Date.UTC(Number(s[1]), Number(s[2]) - 1, Number(s[3]), 0, 0, 0, 0));
  const end = new Date(Date.UTC(Number(e[1]), Number(e[2]) - 1, Number(e[3]), 23, 59, 59, 999));
  if (start > end) return null;
  return { start, end };
}

export function utcTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start, end };
}

export function monthNavLabels(month: string): { prev: string; next: string; current: string } {
  const parsed = utcRangeFromMonth(month) ?? utcMonthRangeFor();
  const y = parsed.start.getUTCFullYear();
  const m = parsed.start.getUTCMonth();
  const prev = new Date(Date.UTC(y, m - 1, 1));
  const next = new Date(Date.UTC(y, m + 1, 1));
  return {
    prev: prev.toISOString().slice(0, 7),
    next: next.toISOString().slice(0, 7),
    current: parsed.label,
  };
}

function qualifyingOrderWhere(start: Date, end: Date): Prisma.OrderWhereInput {
  return {
    createdAt: { gte: start, lte: end },
    orderStatus: { not: OrderStatus.CANCELLED },
  };
}

function expenseWhere(start: Date, end: Date): Prisma.ExpenseWhereInput {
  return { voidedAt: null, expenseDate: { gte: start, lte: end } };
}

export type IncomeExpenseProfitSummary = {
  rangeStartIso: string;
  rangeEndIso: string;
  grossIncome: number;
  dessertIncome: number;
  deliveryFeeIncome: number;
  expenses: number;
  estimatedCogs: number;
  estimatedProductProfit: number;
  netProfit: number;
  estimatedNetProfit: number;
  marginPct: string | null;
  unpaidTotal: number;
  unpaidCount: number;
  orderCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  suspiciousZeroCost: boolean;
};

export async function getIncomeExpenseProfitSummary(
  start: Date,
  end: Date,
): Promise<IncomeExpenseProfitSummary> {
  const orderWhere = qualifyingOrderWhere(start, end);

  const [revAgg, deliAgg, expAgg, unpaidOrders, cancelledCount, itemsCost] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { totalOmr: true, dessertSubtotalOmr: true },
      _count: true,
    }),
    prisma.order.aggregate({ where: orderWhere, _sum: { deliveryFeeOmr: true } }),
    prisma.expense.aggregate({
      where: expenseWhere(start, end),
      _sum: { amountOmr: true },
    }),
    prisma.order.findMany({
      where: { ...orderWhere, paymentStatus: PaymentStatus.UNPAID },
      select: { totalOmr: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: start, lte: end }, orderStatus: OrderStatus.CANCELLED },
    }),
    prisma.orderItem.findMany({
      where: { order: orderWhere },
      select: { quantity: true, estimatedUnitCostOmr: true, estimatedLineProfitOmr: true },
    }),
  ]);

  let estimatedCogs = 0;
  let estimatedProductProfit = 0;
  let suspiciousZeroCost = false;
  for (const row of itemsCost) {
    const q = row.quantity;
    const unitCost = dec(row.estimatedUnitCostOmr);
    estimatedCogs += q * unitCost;
    estimatedProductProfit += dec(row.estimatedLineProfitOmr);
    if (unitCost === 0 && q > 0) suspiciousZeroCost = true;
  }

  const grossIncome = dec(revAgg._sum.totalOmr);
  const dessertIncome = dec(revAgg._sum.dessertSubtotalOmr);
  const deliveryFeeIncome = dec(deliAgg._sum.deliveryFeeOmr);
  const expenses = dec(expAgg._sum.amountOmr);
  const unpaidTotal = unpaidOrders.reduce((a, o) => a + dec(o.totalOmr), 0);
  const orderCount = revAgg._count;
  const netProfit = grossIncome - expenses;
  const estimatedNetProfit = grossIncome - estimatedCogs - expenses;
  const marginPct = grossIncome > 0 ? ((estimatedNetProfit / grossIncome) * 100).toFixed(2) : null;

  return {
    rangeStartIso: start.toISOString(),
    rangeEndIso: end.toISOString(),
    grossIncome,
    dessertIncome,
    deliveryFeeIncome,
    expenses,
    estimatedCogs,
    estimatedProductProfit,
    netProfit,
    estimatedNetProfit,
    marginPct,
    unpaidTotal,
    unpaidCount: unpaidOrders.length,
    orderCount,
    cancelledCount,
    averageOrderValue: orderCount > 0 ? Math.round((grossIncome / orderCount) * 1000) / 1000 : 0,
    suspiciousZeroCost,
  };
}

export type OrderStatusSummary = {
  status: OrderStatus;
  count: number;
};

export async function getOrderStatusSummary(start: Date, end: Date): Promise<OrderStatusSummary[]> {
  const rows = await prisma.order.groupBy({
    by: ["orderStatus"],
    where: { createdAt: { gte: start, lte: end } },
    _count: true,
    orderBy: { orderStatus: "asc" },
  });
  return rows.map((r) => ({ status: r.orderStatus, count: r._count }));
}

export type PaymentSummaryRow = {
  paymentStatus: PaymentStatus;
  count: number;
  totalOmr: number;
};

export async function getPaymentSummary(start: Date, end: Date): Promise<PaymentSummaryRow[]> {
  const orderWhere = qualifyingOrderWhere(start, end);
  const rows = await prisma.order.groupBy({
    by: ["paymentStatus"],
    where: orderWhere,
    _count: true,
    _sum: { totalOmr: true },
    orderBy: { paymentStatus: "asc" },
  });
  return rows.map((r) => ({
    paymentStatus: r.paymentStatus,
    count: r._count,
    totalOmr: dec(r._sum.totalOmr),
  }));
}

export type FulfillmentSummaryRow = {
  fulfillmentMethod: FulfillmentMethod;
  count: number;
};

export async function getFulfillmentSummary(start: Date, end: Date): Promise<FulfillmentSummaryRow[]> {
  const orderWhere = qualifyingOrderWhere(start, end);
  const rows = await prisma.order.groupBy({
    by: ["fulfillmentMethod"],
    where: orderWhere,
    _count: true,
    orderBy: { fulfillmentMethod: "asc" },
  });
  return rows.map((r) => ({ fulfillmentMethod: r.fulfillmentMethod, count: r._count }));
}

export type ProductSalesRow = {
  productNameEn: string;
  productNameAr: string;
  sizeLabelEn: string;
  sizeLabelAr: string;
  quantitySold: number;
  revenue: number;
  estimatedCost: number;
  estimatedProfit: number;
};

export async function getProductSalesSummary(start: Date, end: Date): Promise<ProductSalesRow[]> {
  const orderWhere = qualifyingOrderWhere(start, end);
  const items = await prisma.orderItem.findMany({
    where: { order: orderWhere },
    select: {
      productNameEn: true,
      productNameAr: true,
      sizeLabelEn: true,
      sizeLabelAr: true,
      quantity: true,
      lineTotalOmr: true,
      estimatedUnitCostOmr: true,
      estimatedLineProfitOmr: true,
    },
  });

  const map = new Map<string, ProductSalesRow>();
  for (const item of items) {
    const key = `${item.productNameEn}::${item.sizeLabelEn}`;
    const row = map.get(key) ?? {
      productNameEn: item.productNameEn,
      productNameAr: item.productNameAr,
      sizeLabelEn: item.sizeLabelEn,
      sizeLabelAr: item.sizeLabelAr,
      quantitySold: 0,
      revenue: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
    };
    row.quantitySold += item.quantity;
    row.revenue += dec(item.lineTotalOmr);
    row.estimatedCost += item.quantity * dec(item.estimatedUnitCostOmr);
    row.estimatedProfit += dec(item.estimatedLineProfitOmr);
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => b.quantitySold - a.quantitySold);
}

export type ExpenseCategoryRow = {
  category: string;
  totalAmount: number;
  count: number;
};

export type ExpenseTopRow = {
  id: string;
  title: string;
  category: string;
  amountOmr: number;
  expenseDateYmd: string;
};

export async function getExpenseBreakdown(start: Date, end: Date) {
  const where = expenseWhere(start, end);
  const [byCategory, topExpenses] = await Promise.all([
    prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amountOmr: true },
      _count: true,
      orderBy: { category: "asc" },
    }),
    prisma.expense.findMany({
      where,
      orderBy: [{ amountOmr: "desc" }, { expenseDate: "desc" }],
      take: 10,
      select: { id: true, title: true, category: true, amountOmr: true, expenseDate: true },
    }),
  ]);

  return {
    byCategory: byCategory.map((c) => ({
      category: c.category,
      totalAmount: dec(c._sum.amountOmr),
      count: c._count,
    })),
    topExpenses: topExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amountOmr: dec(e.amountOmr),
      expenseDateYmd: new Date(e.expenseDate).toISOString().slice(0, 10),
    })),
  };
}

export type DailyTrendRow = {
  dateYmd: string;
  orders: number;
  income: number;
  expenses: number;
  netProfit: number;
};

export async function getDailyTrend(start: Date, end: Date): Promise<DailyTrendRow[]> {
  const orderWhere = qualifyingOrderWhere(start, end);
  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: orderWhere,
      select: { createdAt: true, totalOmr: true },
    }),
    prisma.expense.findMany({
      where: expenseWhere(start, end),
      select: { expenseDate: true, amountOmr: true },
    }),
  ]);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const incomeByDay: Record<string, number> = {};
  const ordersByDay: Record<string, number> = {};
  for (const o of orders) {
    const k = dayKey(o.createdAt);
    incomeByDay[k] = (incomeByDay[k] ?? 0) + dec(o.totalOmr);
    ordersByDay[k] = (ordersByDay[k] ?? 0) + 1;
  }

  const expenseByDay: Record<string, number> = {};
  for (const e of expenses) {
    const k = dayKey(new Date(e.expenseDate));
    expenseByDay[k] = (expenseByDay[k] ?? 0) + dec(e.amountOmr);
  }

  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(dayKey(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return days.map((dateYmd) => {
    const income = incomeByDay[dateYmd] ?? 0;
    const exp = expenseByDay[dateYmd] ?? 0;
    return {
      dateYmd,
      orders: ordersByDay[dateYmd] ?? 0,
      income,
      expenses: exp,
      netProfit: income - exp,
    };
  });
}

export async function getDeliveredCount(start: Date, end: Date): Promise<number> {
  return prisma.order.count({
    where: {
      createdAt: { gte: start, lte: end },
      orderStatus: OrderStatus.DELIVERED,
    },
  });
}

export async function getBestSellerForRange(start: Date, end: Date) {
  const orderWhere = qualifyingOrderWhere(start, end);
  const top = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { AND: [{ productId: { not: null } }, { order: orderWhere }] },
    _sum: { quantity: true, lineTotalOmr: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 1,
  });
  const row = top[0];
  if (!row?.productId) return null;
  const product = await prisma.product.findUnique({
    where: { id: row.productId },
    select: { nameEn: true },
  });
  return {
    nameEn: product?.nameEn ?? "(unlinked)",
    quantity: row._sum.quantity ?? 0,
    revenue: dec(row._sum.lineTotalOmr),
  };
}

export async function getDateRangeBusinessReport(start: Date, end: Date) {
  const [summary, orderStatus, payment, fulfillment, productSales, expenses, dailyTrend, deliveredCount] =
    await Promise.all([
      getIncomeExpenseProfitSummary(start, end),
      getOrderStatusSummary(start, end),
      getPaymentSummary(start, end),
      getFulfillmentSummary(start, end),
      getProductSalesSummary(start, end),
      getExpenseBreakdown(start, end),
      getDailyTrend(start, end),
      getDeliveredCount(start, end),
    ]);

  const bestByQty = productSales[0] ?? null;
  const bestByRevenue = [...productSales].sort((a, b) => b.revenue - a.revenue)[0] ?? null;

  return {
    summary,
    deliveredCount,
    orderStatus,
    payment,
    fulfillment,
    productSales,
    expenses,
    dailyTrend,
    bestByQty,
    bestByRevenue,
  };
}

export async function getTodayIncome(): Promise<number> {
  const { start, end } = utcTodayRange();
  const agg = await prisma.order.aggregate({
    where: qualifyingOrderWhere(start, end),
    _sum: { totalOmr: true },
  });
  return dec(agg._sum.totalOmr);
}
