import {
  exportFilename,
  exportOrdersRows,
} from "@/lib/admin/data/export-queries";
import {
  csvResponse,
  parseExportSearchParams,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";

const HEADERS = [
  "publicId",
  "customerName",
  "customerPhone",
  "orderStatus",
  "paymentStatus",
  "fulfillmentMethod",
  "deliveryStatus",
  "dateNeeded",
  "dessertSubtotalOmr",
  "deliveryFeeOmr",
  "totalOmr",
  "createdAt",
];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const params = parseExportSearchParams(searchParams);
  const rows = await exportOrdersRows(params.month, params.start, params.end);
  return csvResponse(exportFilename("orders", params.month, params.start, params.end), HEADERS, rows);
}
