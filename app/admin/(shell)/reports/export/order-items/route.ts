import {
  exportFilename,
  exportOrderItemsRows,
} from "@/lib/admin/data/export-queries";
import {
  csvResponse,
  parseExportSearchParams,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";

const HEADERS = [
  "orderPublicId",
  "productNameEn",
  "productNameAr",
  "sizeLabelEn",
  "sizeLabelAr",
  "quantity",
  "unitPriceOmr",
  "lineTotalOmr",
  "estimatedUnitCostOmr",
  "estimatedLineProfitOmr",
];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const params = parseExportSearchParams(searchParams);
  const rows = await exportOrderItemsRows(params.month, params.start, params.end);
  return csvResponse(exportFilename("order-items", params.month, params.start, params.end), HEADERS, rows);
}
