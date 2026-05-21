import {
  exportFilename,
  exportProfitSummaryRows,
} from "@/lib/admin/data/export-queries";
import {
  csvResponse,
  parseExportSearchParams,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";

const HEADERS = [
  "period",
  "grossIncome",
  "dessertIncome",
  "deliveryFeeIncome",
  "expenses",
  "netProfit",
  "estimatedNetProfit",
  "unpaidTotal",
  "orderCount",
  "cancelledCount",
  "averageOrderValue",
];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const params = parseExportSearchParams(searchParams);
  const rows = await exportProfitSummaryRows(params.month, params.start, params.end);
  return csvResponse(exportFilename("profit", params.month, params.start, params.end), HEADERS, rows);
}
