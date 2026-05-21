import {
  exportFilename,
  exportProductSalesRows,
} from "@/lib/admin/data/export-queries";
import {
  csvResponse,
  parseExportSearchParams,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";

const HEADERS = ["product", "size", "quantitySold", "revenue", "estimatedCost", "estimatedProfit"];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const params = parseExportSearchParams(searchParams);
  const rows = await exportProductSalesRows(params.month, params.start, params.end);
  return csvResponse(exportFilename("product-sales", params.month, params.start, params.end), HEADERS, rows);
}
