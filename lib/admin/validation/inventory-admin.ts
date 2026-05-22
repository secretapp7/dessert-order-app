import { z } from "zod";

import {
  InventoryItemType,
  InventoryMovementType,
  InventoryUnit,
} from "@prisma/client";

const NAME_MAX = 200;
const TEXT_MAX = 5000;
const SLUG_MAX = 80;

const inventoryTypes = Object.values(InventoryItemType) as [InventoryItemType, ...InventoryItemType[]];
const inventoryUnits = Object.values(InventoryUnit) as [InventoryUnit, ...InventoryUnit[]];
const movementTypes = Object.values(InventoryMovementType) as [
  InventoryMovementType,
  ...InventoryMovementType[],
];

const nonNegativeDecimal = z
  .string()
  .trim()
  .min(1, "Quantity is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }, "Must be zero or greater.");

const optionalNonNegativeDecimal = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((v) => {
    if (!v?.trim()) return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }, "Must be zero or greater.");

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(SLUG_MAX)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens.");

export const inventoryItemCoreSchema = z.object({
  type: z.enum(inventoryTypes),
  categoryId: z.string().trim().optional().or(z.literal("")),
  nameEn: z.string().trim().min(1, "English name is required.").max(NAME_MAX),
  nameAr: z.string().trim().max(NAME_MAX).optional().or(z.literal("")),
  sku: z.string().trim().max(64).optional().or(z.literal("")),
  unit: z.enum(inventoryUnits),
  currentQuantity: nonNegativeDecimal,
  lowStockThreshold: optionalNonNegativeDecimal,
  reorderQuantity: optionalNonNegativeDecimal,
  averageUnitCostOmr: optionalNonNegativeDecimal,
  supplierName: z.string().trim().max(200).optional().or(z.literal("")),
  supplierContact: z.string().trim().max(200).optional().or(z.literal("")),
  storageLocation: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(TEXT_MAX).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const inventoryItemUpdateSchema = inventoryItemCoreSchema.extend({
  id: z.string().min(1),
});

export const inventoryCategorySchema = z.object({
  nameEn: z.string().trim().min(1, "English name is required.").max(NAME_MAX),
  nameAr: z.string().trim().max(NAME_MAX).optional().or(z.literal("")),
  slug: slugSchema,
  type: z.enum(inventoryTypes),
  description: z.string().trim().max(TEXT_MAX).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

export const inventoryCategoryUpdateSchema = inventoryCategorySchema.extend({
  id: z.string().min(1),
});

export const inventoryMovementSchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(movementTypes),
  quantity: z.string().trim().min(1, "Quantity is required."),
  unitCostOmr: optionalNonNegativeDecimal,
  reason: z.string().trim().max(500).optional().or(z.literal("")),
  movementDate: z.string().trim().optional().or(z.literal("")),
  targetQuantity: optionalNonNegativeDecimal,
});

export const inventoryIdSchema = z.object({
  id: z.string().min(1, "Missing item."),
});

export const inventoryCategoryIdSchema = z.object({
  id: z.string().min(1, "Missing category."),
});

export function parseOptionalDecimal(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseRequiredDecimal(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Invalid number.");
  return n;
}
