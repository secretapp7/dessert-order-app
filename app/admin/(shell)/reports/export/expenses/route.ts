import {
  exportExpensesRows,
  exportFilename,
} from "@/lib/admin/data/export-queries";
import {
  csvResponse,
  parseExportSearchParams,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";

const HEADERS = ["title", "category", "amountOmr", "expenseDate", "notes", "voidedAt", "voidReason"];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const params = parseExportSearchParams(searchParams);
  const rows = await exportExpensesRows(params.month, params.start, params.end);
  return csvResponse(exportFilename("expenses", params.month, params.start, params.end), HEADERS, rows);
}
