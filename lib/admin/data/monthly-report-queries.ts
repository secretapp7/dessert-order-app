import "server-only";

import {
  getDateRangeBusinessReport,
  utcMonthRangeFor,
  type DailyTrendRow,
  type ExpenseCategoryRow,
  type ExpenseTopRow,
  type FulfillmentSummaryRow,
  type IncomeExpenseProfitSummary,
  type OrderStatusSummary,
  type PaymentSummaryRow,
  type ProductSalesRow,
} from "@/lib/admin/data/report-queries";

export type MonthlyBusinessReport = {
  monthLabel: string;
  monthStartIso: string;
  monthEndIso: string;
  summary: IncomeExpenseProfitSummary;
  deliveredCount: number;
  orderStatus: OrderStatusSummary[];
  payment: PaymentSummaryRow[];
  fulfillment: FulfillmentSummaryRow[];
  productSales: ProductSalesRow[];
  expenseByCategory: ExpenseCategoryRow[];
  topExpenses: ExpenseTopRow[];
  dailyTrend: DailyTrendRow[];
  bestByQty: ProductSalesRow | null;
  bestByRevenue: ProductSalesRow | null;
};

export async function getMonthlyBusinessReport(month?: string): Promise<MonthlyBusinessReport> {
  const { start, end, label } = utcMonthRangeFor(month);
  const report = await getDateRangeBusinessReport(start, end);

  return {
    monthLabel: label,
    monthStartIso: start.toISOString(),
    monthEndIso: end.toISOString(),
    summary: report.summary,
    deliveredCount: report.deliveredCount,
    orderStatus: report.orderStatus,
    payment: report.payment,
    fulfillment: report.fulfillment,
    productSales: report.productSales,
    expenseByCategory: report.expenses.byCategory,
    topExpenses: report.expenses.topExpenses,
    dailyTrend: report.dailyTrend,
    bestByQty: report.bestByQty,
    bestByRevenue: report.bestByRevenue,
  };
}
