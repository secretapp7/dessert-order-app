import {
  csvResponse,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";
import {
  exportInventoryMovementRows,
  parseYmdUtcEnd,
  parseYmdUtcStart,
} from "@/lib/admin/data/inventory-queries";

const HEADERS = ["item", "type", "quantity", "unit", "totalCostOmr", "reason", "movementDate"];

export async function GET(request: Request) {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const from = parseYmdUtcStart(searchParams.get("from")?.trim() || undefined);
  const to = parseYmdUtcEnd(searchParams.get("to")?.trim() || undefined);
  const rows = await exportInventoryMovementRows(from, to);
  return csvResponse("coco-treats-inventory-movements.csv", HEADERS, rows);
}
