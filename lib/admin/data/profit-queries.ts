import "server-only";

import {
  getDateRangeBusinessReport,
  getIncomeExpenseProfitSummary,
  utcMonthRangeFor,
} from "@/lib/admin/data/report-queries";

/** @deprecated Use getIncomeExpenseProfitSummary via report-queries. */
export function utcMonthRange() {
  return utcMonthRangeFor();
}

export async function getMonthProfitBriefUtc(month?: string) {
  const { start, end, label } = utcMonthRangeFor(month);
  const summary = await getIncomeExpenseProfitSummary(start, end);
  return {
    monthLabel: label,
    monthStart: start,
    monthEnd: end,
    revenue: summary.grossIncome,
    dessertRevenue: summary.dessertIncome,
    deliveryFees: summary.deliveryFeeIncome,
    expensesTotal: summary.expenses,
    estimatedCogs: summary.estimatedCogs,
    estimatedLineProfitSum: summary.estimatedProductProfit,
    estimatedGrossProfit: summary.grossIncome - summary.estimatedCogs,
    estimatedNetProfit: summary.estimatedNetProfit,
    marginPct: summary.marginPct,
    suspiciousZeroCost: summary.suspiciousZeroCost,
    ordersCount: summary.orderCount,
    unpaidCount: summary.unpaidCount,
    unpaidTotal: summary.unpaidTotal,
    netProfit: summary.netProfit,
    averageOrderValue: summary.averageOrderValue,
  };
}

export type ProfitReportUtcMonth = Awaited<ReturnType<typeof getProfitReportUtcMonth>>;

export async function getProfitReportUtcMonth(month?: string) {
  const { start, end, label } = utcMonthRangeFor(month);
  const report = await getDateRangeBusinessReport(start, end);
  const brief = await getMonthProfitBriefUtc(month);

  const topProducts = report.productSales.slice(0, 15).map((p) => ({
    id: `${p.productNameEn}::${p.sizeLabelEn}`,
    nameEn: `${p.productNameEn} (${p.sizeLabelEn})`,
    nameAr: p.productNameAr,
    qty: p.quantitySold,
    revenue: p.revenue,
    estimatedProfit: p.estimatedProfit,
  }));

  return {
    ...brief,
    monthLabel: label,
    deliveredCount: report.deliveredCount,
    expenseByCategory: report.expenses.byCategory.map((c) => ({
      category: c.category,
      sum: c.totalAmount,
      count: c.count,
    })),
    topProducts,
    productSales: report.productSales,
    dailyRevenue: report.dailyTrend.map((d) => ({ day: d.dateYmd, amount: d.income })),
    dailyExpenses: report.dailyTrend.map((d) => ({ day: d.dateYmd, amount: d.expenses })),
    dailyNet: report.dailyTrend.map((d) => ({ day: d.dateYmd, amount: d.netProfit })),
    paymentSummary: report.payment,
    unpaidTotal: brief.unpaidTotal,
  };
}
