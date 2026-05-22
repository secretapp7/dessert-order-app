import type {
  InventoryItemType,
  InventoryMovementType,
  InventoryUnit,
} from "@prisma/client";

import { decimalToFormString } from "@/lib/admin/admin-serialize";

export function dec(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatInventoryQuantity(value: unknown): string {
  return decimalToFormString(value);
}

export function formatInventoryMoney(value: unknown): string {
  return decimalToFormString(value);
}

export const INVENTORY_TYPE_LABELS: Record<InventoryItemType, string> = {
  INGREDIENT: "Ingredient",
  PACKAGING: "Packaging",
  SUPPLY: "Supply",
  TOOL: "Tool",
  OTHER: "Other",
};

export const INVENTORY_UNIT_LABELS: Record<InventoryUnit, string> = {
  GRAM: "g",
  KILOGRAM: "kg",
  MILLILITER: "ml",
  LITER: "L",
  PIECE: "piece",
  PACK: "pack",
  BOX: "box",
  BAG: "bag",
  BOTTLE: "bottle",
  CAN: "can",
  OTHER: "other",
};

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  ADJUSTMENT: "Adjustment",
  WASTE: "Waste",
  RESERVED: "Reserved",
  RELEASED: "Released",
  MANUAL_CORRECTION: "Manual correction",
};

export function isLowStock(
  currentQuantity: number,
  lowStockThreshold: number | null,
): boolean {
  if (lowStockThreshold == null || lowStockThreshold <= 0) return false;
  return currentQuantity <= lowStockThreshold;
}

export function estimatedItemValue(currentQuantity: number, averageUnitCostOmr: number | null): number {
  if (averageUnitCostOmr == null || averageUnitCostOmr <= 0) return 0;
  return Math.round(currentQuantity * averageUnitCostOmr * 1000) / 1000;
}

export type InventoryItemAdminRecord = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  type: InventoryItemType;
  nameEn: string;
  nameAr: string | null;
  sku: string | null;
  unit: InventoryUnit;
  currentQuantity: number;
  lowStockThreshold: number | null;
  reorderQuantity: number | null;
  averageUnitCostOmr: number | null;
  supplierName: string | null;
  supplierContact: string | null;
  storageLocation: string | null;
  notes: string | null;
  isActive: boolean;
  isLowStock: boolean;
  estimatedValueOmr: number;
  movementCount: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type InventoryCategoryAdminRecord = {
  id: string;
  nameEn: string;
  nameAr: string | null;
  slug: string;
  type: InventoryItemType;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  itemCount: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type InventoryMovementAdminRecord = {
  id: string;
  itemId: string;
  itemName: string;
  type: InventoryMovementType;
  quantity: number;
  unit: InventoryUnit;
  unitCostOmr: number | null;
  totalCostOmr: number | null;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  movementDateIso: string;
  createdAtIso: string;
};

export type InventoryDashboardSummary = {
  totalActiveItems: number;
  lowStockCount: number;
  packagingLowStockCount: number;
  ingredientCount: number;
  packagingCount: number;
  totalEstimatedValueOmr: number;
};
