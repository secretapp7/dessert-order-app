"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import {
  createClosedDateFormAction,
  deactivateClosedDateFormAction,
  updateClosedDateFormAction,
} from "@/lib/admin/actions/availability-actions";
import type { ClosedDateAdminClientRecord } from "@/lib/admin/availability-admin-record";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";

function utcDatetimeLocal(value: Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function ClosedDateCreateForm() {
  return (
    <AdminActionForm action={createClosedDateFormAction} className="max-w-xl space-y-3">
      <label className={lbl}>
        Starts (UTC)
        <input name="startsAt" type="datetime-local" required className={field} />
      </label>
      <label className={lbl}>
        Ends (UTC)
        <input name="endsAt" type="datetime-local" required className={field} />
      </label>
      <label className={lbl}>
        Reason (EN, optional)
        <textarea name="reasonEn" rows={2} className={field} />
      </label>
      <label className={lbl}>
        Reason (AR, optional)
        <textarea name="reasonAr" rows={2} className={field} dir="rtl" />
      </label>
      <label className={`${lbl} flex items-center gap-2`}>
        <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
        Active
      </label>
      <button type="submit" className={btn}>
        Save closed period
      </button>
    </AdminActionForm>
  );
}

export function ClosedDateEditForm({ row }: { row: ClosedDateAdminClientRecord }) {
  return (
    <div className="space-y-6">
      <AdminActionForm action={updateClosedDateFormAction} className="max-w-xl space-y-3">
        <input type="hidden" name="id" value={row.id} />
        <label className={lbl}>
          Starts (UTC)
          <input
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={row.startsAtLocal}
            className={field}
          />
        </label>
        <label className={lbl}>
          Ends (UTC)
          <input
            name="endsAt"
            type="datetime-local"
            required
            defaultValue={row.endsAtLocal}
            className={field}
          />
        </label>
        <label className={lbl}>
          Reason (EN, optional)
          <textarea name="reasonEn" rows={2} defaultValue={row.reasonEn ?? ""} className={field} />
        </label>
        <label className={lbl}>
          Reason (AR, optional)
          <textarea name="reasonAr" rows={2} defaultValue={row.reasonAr ?? ""} className={field} dir="rtl" />
        </label>
        <label className={`${lbl} flex items-center gap-2`}>
          <input type="checkbox" name="isActive" defaultChecked={row.isActive} className="h-4 w-4" />
          Active
        </label>
        <button type="submit" className={btn}>
          Save changes
        </button>
      </AdminActionForm>
      <AdminActionForm action={deactivateClosedDateFormAction}>
        <input type="hidden" name="id" value={row.id} />
        <button
          type="submit"
          className="rounded-lg border border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-burgundy)]"
        >
          Deactivate (keep history)
        </button>
      </AdminActionForm>
    </div>
  );
}
