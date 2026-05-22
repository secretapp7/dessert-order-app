"use client";

import { InventoryItemType, InventoryMovementType, InventoryUnit } from "@prisma/client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  activateInventoryItemFormAction,
  createInventoryCategoryFormAction,
  createInventoryItemFormAction,
  createInventoryMovementFormAction,
  deactivateInventoryCategoryFormAction,
  deactivateInventoryItemFormAction,
  deleteInventoryCategoryFormAction,
  deleteInventoryItemFormAction,
  updateInventoryCategoryFormAction,
  updateInventoryItemFormAction,
} from "@/lib/admin/actions/inventory-actions";
import type {
  InventoryCategoryAdminRecord,
  InventoryItemAdminRecord,
} from "@/lib/admin/inventory-serialize";
import {
  formatInventoryMoney,
  formatInventoryQuantity,
  INVENTORY_TYPE_LABELS,
  INVENTORY_UNIT_LABELS,
} from "@/lib/admin/inventory-serialize";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";
const btnOutline =
  "rounded-lg border border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy)]";
const btnDanger =
  "rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-900";

type CategoryOption = { id: string; nameEn: string; type: InventoryItemType };

function TypeSelect({ name, defaultValue }: { name?: string; defaultValue?: InventoryItemType }) {
  return (
    <select name={name ?? "type"} defaultValue={defaultValue ?? InventoryItemType.INGREDIENT} className={field} required>
      {Object.entries(INVENTORY_TYPE_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v}
        </option>
      ))}
    </select>
  );
}

function UnitSelect({ name, defaultValue }: { name?: string; defaultValue?: InventoryUnit }) {
  return (
    <select name={name ?? "unit"} defaultValue={defaultValue ?? InventoryUnit.PIECE} className={field} required>
      {Object.entries(INVENTORY_UNIT_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v} ({k})
        </option>
      ))}
    </select>
  );
}

function CategorySelect({
  categories,
  defaultValue,
}: {
  categories: CategoryOption[];
  defaultValue?: string | null;
}) {
  return (
    <select name="categoryId" defaultValue={defaultValue ?? ""} className={field}>
      <option value="">— No category —</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nameEn} ({INVENTORY_TYPE_LABELS[c.type]})
        </option>
      ))}
    </select>
  );
}

export function InventoryItemFormFields({
  item,
  categories,
  isCreate,
}: {
  item?: InventoryItemAdminRecord;
  categories: CategoryOption[];
  isCreate?: boolean;
}) {
  return (
    <>
      <label className={lbl}>
        Type
        <TypeSelect defaultValue={item?.type} />
      </label>
      <label className={lbl}>
        Category (optional)
        <CategorySelect categories={categories} defaultValue={item?.categoryId} />
      </label>
      <label className={lbl}>
        Name (EN)
        <input name="nameEn" required defaultValue={item?.nameEn ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Name (AR, optional)
        <input name="nameAr" defaultValue={item?.nameAr ?? ""} className={field} dir="rtl" />
      </label>
      <label className={lbl}>
        SKU (optional)
        <input name="sku" defaultValue={item?.sku ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Unit
        <UnitSelect defaultValue={item?.unit} />
      </label>
      {isCreate ? (
        <label className={lbl}>
          Initial quantity
          <input name="currentQuantity" type="number" step="0.001" min="0" defaultValue="0" className={field} />
        </label>
      ) : null}
      <label className={lbl}>
        Low stock threshold (optional)
        <input
          name="lowStockThreshold"
          type="number"
          step="0.001"
          min="0"
          defaultValue={item?.lowStockThreshold != null ? formatInventoryQuantity(item.lowStockThreshold) : ""}
          className={field}
        />
      </label>
      <label className={lbl}>
        Reorder quantity (optional)
        <input
          name="reorderQuantity"
          type="number"
          step="0.001"
          min="0"
          defaultValue={item?.reorderQuantity != null ? formatInventoryQuantity(item.reorderQuantity) : ""}
          className={field}
        />
      </label>
      <label className={lbl}>
        Average unit cost OMR (optional)
        <input
          name="averageUnitCostOmr"
          type="number"
          step="0.001"
          min="0"
          defaultValue={item?.averageUnitCostOmr != null ? formatInventoryMoney(item.averageUnitCostOmr) : ""}
          className={field}
        />
      </label>
      <label className={lbl}>
        Supplier name (optional)
        <input name="supplierName" defaultValue={item?.supplierName ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Supplier contact (optional)
        <input name="supplierContact" defaultValue={item?.supplierContact ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Storage location (optional)
        <input name="storageLocation" defaultValue={item?.storageLocation ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Notes (optional)
        <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} className={field} />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked={item?.isActive ?? true} className="h-4 w-4" />
        Active
      </label>
    </>
  );
}

export function InventoryItemCreateForm({ categories }: { categories: CategoryOption[] }) {
  return (
    <AdminActionForm action={createInventoryItemFormAction} className="max-w-xl space-y-3">
      <InventoryItemFormFields categories={categories} isCreate />
      <button type="submit" className={btn}>
        Create item
      </button>
    </AdminActionForm>
  );
}

export function InventoryItemEditForm({
  item,
  categories,
}: {
  item: InventoryItemAdminRecord;
  categories: CategoryOption[];
}) {
  return (
    <AdminActionForm action={updateInventoryItemFormAction} className="max-w-xl space-y-3">
      <input type="hidden" name="id" value={item.id} />
      <InventoryItemFormFields item={item} categories={categories} />
      <button type="submit" className={btn}>
        Save item
      </button>
    </AdminActionForm>
  );
}

export function InventoryItemActions({ item }: { item: InventoryItemAdminRecord }) {
  return (
    <div className="flex flex-wrap gap-2">
      {item.isActive ? (
        <AdminActionForm action={deactivateInventoryItemFormAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className={btnOutline}>
            Deactivate
          </button>
        </AdminActionForm>
      ) : (
        <AdminActionForm action={activateInventoryItemFormAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className={btn}>
            Activate
          </button>
        </AdminActionForm>
      )}
      {item.movementCount === 0 ? (
        <AdminActionForm action={deleteInventoryItemFormAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className={btnDanger}>
            Delete item
          </button>
        </AdminActionForm>
      ) : null}
    </div>
  );
}

export function InventoryMovementForm({ itemId }: { itemId: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(
        [
          [InventoryMovementType.STOCK_IN, "Stock in", false],
          [InventoryMovementType.STOCK_OUT, "Stock out", false],
          [InventoryMovementType.WASTE, "Waste", false],
          [InventoryMovementType.ADJUSTMENT, "Adjustment (+/-)", true],
        ] as const
      ).map(([type, label, signed]) => (
        <AdminActionForm key={type} action={createInventoryMovementFormAction} className="space-y-2 rounded-xl border border-[color:var(--border-soft)] bg-white/80 p-3">
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="type" value={type} />
          <p className="text-xs font-bold text-[color:var(--brand-burgundy)]">{label}</p>
          <label className={lbl}>
            Quantity{signed ? " (+ or -)" : ""}
            <input
              name="quantity"
              type="number"
              step="0.001"
              required
              placeholder={signed ? "e.g. -2 or 5" : "0"}
              className={field}
            />
          </label>
          {type === InventoryMovementType.STOCK_IN ? (
            <label className={lbl}>
              Unit cost OMR (optional)
              <input name="unitCostOmr" type="number" step="0.001" min="0" className={field} />
            </label>
          ) : null}
          <label className={lbl}>
            Reason (optional)
            <input name="reason" className={field} />
          </label>
          <label className={lbl}>
            Date
            <input name="movementDate" type="datetime-local" className={field} />
          </label>
          <button type="submit" className={btn}>
            Record
          </button>
        </AdminActionForm>
      ))}

      <AdminActionForm action={createInventoryMovementFormAction} className="space-y-2 rounded-xl border border-[color:var(--border-soft)] bg-white/80 p-3 lg:col-span-2">
        <input type="hidden" name="itemId" value={itemId} />
        <input type="hidden" name="type" value={InventoryMovementType.MANUAL_CORRECTION} />
        <input type="hidden" name="quantity" value="0" />
        <p className="text-xs font-bold text-[color:var(--brand-burgundy)]">Manual correction (set exact quantity)</p>
        <label className={lbl}>
          Target quantity
          <input name="targetQuantity" type="number" step="0.001" min="0" required className={field} />
        </label>
        <label className={lbl}>
          Reason (required)
          <input name="reason" required className={field} />
        </label>
        <label className={lbl}>
          Date
          <input name="movementDate" type="datetime-local" className={field} />
        </label>
        <button type="submit" className={btnOutline}>
          Apply correction
        </button>
      </AdminActionForm>
    </div>
  );
}

export function InventoryCategoryForm({
  category,
}: {
  category?: InventoryCategoryAdminRecord;
}) {
  const action = category ? updateInventoryCategoryFormAction : createInventoryCategoryFormAction;
  return (
    <AdminActionForm action={action} className="max-w-xl space-y-3 rounded-xl border border-[color:var(--border-soft)] bg-white/80 p-4">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <label className={lbl}>
        Name (EN)
        <input name="nameEn" required defaultValue={category?.nameEn ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Name (AR)
        <input name="nameAr" defaultValue={category?.nameAr ?? ""} className={field} dir="rtl" />
      </label>
      <label className={lbl}>
        Slug
        <input name="slug" required defaultValue={category?.slug ?? ""} className={field} placeholder="ingredients" />
      </label>
      <label className={lbl}>
        Type
        <TypeSelect defaultValue={category?.type} />
      </label>
      <label className={lbl}>
        Description
        <textarea name="description" rows={2} defaultValue={category?.description ?? ""} className={field} />
      </label>
      <label className={lbl}>
        Sort order
        <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className={field} />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="h-4 w-4" />
        Active
      </label>
      <button type="submit" className={btn}>
        {category ? "Save category" : "Add category"}
      </button>
    </AdminActionForm>
  );
}

export function InventoryCategoryRowActions({ category }: { category: InventoryCategoryAdminRecord }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {category.isActive ? (
        <AdminActionForm action={deactivateInventoryCategoryFormAction}>
          <input type="hidden" name="id" value={category.id} />
          <button type="submit" className={btnOutline}>
            Deactivate
          </button>
        </AdminActionForm>
      ) : null}
      {category.itemCount === 0 ? (
        <AdminActionForm action={deleteInventoryCategoryFormAction}>
          <input type="hidden" name="id" value={category.id} />
          <button type="submit" className={btnDanger}>
            Delete
          </button>
        </AdminActionForm>
      ) : null}
    </div>
  );
}
