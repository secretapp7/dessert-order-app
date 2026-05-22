import {
  csvResponse,
  requireAdminExportSession,
} from "@/lib/admin/reports/export-route";
import { exportInventoryRows } from "@/lib/admin/data/inventory-queries";

const HEADERS = [
  "name",
  "type",
  "category",
  "currentQuantity",
  "unit",
  "lowStockThreshold",
  "averageUnitCostOmr",
  "estimatedValue",
  "supplierName",
  "active",
];

export async function GET() {
  const denied = await requireAdminExportSession();
  if (denied) return denied;

  const rows = await exportInventoryRows();
  return csvResponse("coco-treats-inventory.csv", HEADERS, rows);
}
