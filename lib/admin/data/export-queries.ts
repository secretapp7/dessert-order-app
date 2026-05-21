import "server-only";

import { OrderStatus } from "@prisma/client";

import {
  getIncomeExpenseProfitSummary,
  getProductSalesSummary,
  utcMonthRangeFor,
  utcRangeFromYmd,
} from "@/lib/admin/data/report-queries";
import { prisma } from "@/lib/db/prisma";

function dec(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function resolveRange(month?: string, startYmd?: string, endYmd?: string) {
  if (startYmd && endYmd) {
    const custom = utcRangeFromYmd(startYmd, endYmd);
    if (custom) {
      return {
        start: custom.start,
        end: custom.end,
        label: `${startYmd}_to_${endYmd}`,
      };
    }
  }
  return utcMonthRangeFor(month);
}

export async function exportOrdersRows(month?: string, startYmd?: string, endYmd?: string) {
  const { start, end } = resolveRange(month, startYmd, endYmd);
  const rows = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "asc" },
    select: {
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
    },
  });

  return rows.map((o) => [
    o.publicId,
    o.customerName,
    o.customerPhone,
    o.orderStatus,
    o.paymentStatus,
    o.fulfillmentMethod,
    o.deliveryStatus,
    new Date(o.dateNeeded).toISOString().slice(0, 10),
    dec(o.dessertSubtotalOmr).toFixed(3),
    o.deliveryFeeOmr != null ? dec(o.deliveryFeeOmr).toFixed(3) : "",
    dec(o.totalOmr).toFixed(3),
    o.createdAt.toISOString(),
  ]);
}

export async function exportOrderItemsRows(month?: string, startYmd?: string, endYmd?: string) {
  const { start, end } = resolveRange(month, startYmd, endYmd);
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: start, lte: end },
        orderStatus: { not: OrderStatus.CANCELLED },
      },
    },
    orderBy: { createdAt: "asc" },
    select: {
      order: { select: { publicId: true } },
      productNameEn: true,
      productNameAr: true,
      sizeLabelEn: true,
      sizeLabelAr: true,
      quantity: true,
      unitPriceOmr: true,
      lineTotalOmr: true,
      estimatedUnitCostOmr: true,
      estimatedLineProfitOmr: true,
    },
  });

  return items.map((i) => [
    i.order.publicId,
    i.productNameEn,
    i.productNameAr,
    i.sizeLabelEn,
    i.sizeLabelAr,
    i.quantity,
    dec(i.unitPriceOmr).toFixed(3),
    dec(i.lineTotalOmr).toFixed(3),
    dec(i.estimatedUnitCostOmr).toFixed(3),
    dec(i.estimatedLineProfitOmr).toFixed(3),
  ]);
}

export async function exportExpensesRows(month?: string, startYmd?: string, endYmd?: string) {
  const { start, end } = resolveRange(month, startYmd, endYmd);
  const rows = await prisma.expense.findMany({
    where: { expenseDate: { gte: start, lte: end } },
    orderBy: [{ expenseDate: "asc" }, { createdAt: "asc" }],
    select: {
      title: true,
      category: true,
      amountOmr: true,
      expenseDate: true,
      notes: true,
      voidedAt: true,
      voidReason: true,
    },
  });

  return rows.map((e) => [
    e.title,
    e.category,
    dec(e.amountOmr).toFixed(3),
    new Date(e.expenseDate).toISOString().slice(0, 10),
    e.notes ?? "",
    e.voidedAt ? e.voidedAt.toISOString() : "",
    e.voidReason ?? "",
  ]);
}

export async function exportProfitSummaryRows(month?: string, startYmd?: string, endYmd?: string) {
  const range = resolveRange(month, startYmd, endYmd);
  const summary = await getIncomeExpenseProfitSummary(range.start, range.end);
  return [
    [
      range.label,
      summary.grossIncome.toFixed(3),
      summary.dessertIncome.toFixed(3),
      summary.deliveryFeeIncome.toFixed(3),
      summary.expenses.toFixed(3),
      summary.netProfit.toFixed(3),
      summary.estimatedNetProfit.toFixed(3),
      summary.unpaidTotal.toFixed(3),
      summary.orderCount,
      summary.cancelledCount,
      summary.averageOrderValue.toFixed(3),
    ],
  ];
}

export async function exportProductSalesRows(month?: string, startYmd?: string, endYmd?: string) {
  const { start, end } = resolveRange(month, startYmd, endYmd);
  const sales = await getProductSalesSummary(start, end);
  return sales.map((s) => [
    s.productNameEn,
    s.sizeLabelEn,
    s.quantitySold,
    s.revenue.toFixed(3),
    s.estimatedCost.toFixed(3),
    s.estimatedProfit.toFixed(3),
  ]);
}

export function exportFilename(type: string, month?: string, startYmd?: string, endYmd?: string): string {
  const range = resolveRange(month, startYmd, endYmd);
  const suffix = range.label.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `coco-treats-${type}-${suffix}.csv`;
}
