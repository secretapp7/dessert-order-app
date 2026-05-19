"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  deactivateCapacityOverrideFormAction,
  updateCapacityOverrideFormAction,
  upsertCapacityOverrideFormAction,
} from "@/lib/admin/actions/availability-actions";
import type { CapacityOverrideAdminClientRecord } from "@/lib/admin/availability-admin-record";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";

function ymdUtc(d: Date) {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CapacityOverrideCreateForm() {
  const today = ymdUtc(new Date());
  return (
    <AdminActionForm action={upsertCapacityOverrideFormAction} className="max-w-xl space-y-3">
      <label className={lbl}>
        Date (UTC calendar day)
        <input name="date" type="date" required defaultValue={today} className={field} />
      </label>
      <label className={lbl}>
        Max orders (0 = unlimited for this day)
        <input name="maxOrders" type="number" min={0} required defaultValue={5} className={field} />
      </label>
      <label className={lbl}>
        Note (EN, optional)
        <textarea name="noteEn" rows={2} className={field} />
      </label>
      <label className={lbl}>
        Note (AR, optional)
        <textarea name="noteAr" rows={2} className={field} dir="rtl" />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        Active
      </label>
      <button type="submit" className={btn}>
        Save override
      </button>
    </AdminActionForm>
  );
}

export function CapacityOverrideEditForm({ row }: { row: CapacityOverrideAdminClientRecord }) {
  return (
    <div className="space-y-6">
      <p className="font-mono text-xs text-[color:var(--muted-text)]">
        UTC date: {row.dateYmd} (edit date by creating a new override for another day)
      </p>
      <AdminActionForm action={updateCapacityOverrideFormAction} className="max-w-xl space-y-3">
        <input type="hidden" name="id" value={row.id} />
        <label className={lbl}>
          Max orders
          <input name="maxOrders" type="number" min={0} required defaultValue={row.maxOrders} className={field} />
        </label>
        <label className={lbl}>
          Note (EN, optional)
          <textarea name="noteEn" rows={2} defaultValue={row.noteEn ?? ""} className={field} />
        </label>
        <label className={lbl}>
          Note (AR, optional)
          <textarea name="noteAr" rows={2} defaultValue={row.noteAr ?? ""} className={field} dir="rtl" />
        </label>
        <label className={`${lbl} flex items-center gap-2`}>
          <input type="checkbox" name="isActive" defaultChecked={row.isActive} className="h-4 w-4" />
          Active
        </label>
        <button type="submit" className={btn}>
          Save
        </button>
      </AdminActionForm>
      <AdminActionForm action={deactivateCapacityOverrideFormAction}>
        <input type="hidden" name="id" value={row.id} />
        <button
          type="submit"
          className="rounded-lg border border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy)]"
        >
          Deactivate override
        </button>
      </AdminActionForm>
    </div>
  );
}
