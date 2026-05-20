"use client";

import { AdminActionForm } from "@/components/admin/action-form";
import { updateAvailabilitySettingsFormAction } from "@/lib/admin/actions/availability-actions";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";

export function AvailabilitySettingsForm({
  minimumNoticeDays,
  defaultDailyOrderLimit,
  largeOrderNoticeDays,
  largeOrderQuantityThreshold,
}: {
  minimumNoticeDays: number;
  defaultDailyOrderLimit: number;
  largeOrderNoticeDays: number;
  largeOrderQuantityThreshold: number;
}) {
  return (
    <AdminActionForm action={updateAvailabilitySettingsFormAction} className="max-w-xl space-y-3">
      <label className={lbl}>
        Minimum notice (calendar days, UTC)
        <input
          name="minimumNoticeDays"
          type="number"
          min={0}
          required
          defaultValue={minimumNoticeDays}
          className={field}
        />
      </label>
      <label className={lbl}>
        Default daily order limit (0 = unlimited)
        <input
          name="defaultDailyOrderLimit"
          type="number"
          min={0}
          required
          defaultValue={defaultDailyOrderLimit}
          className={field}
        />
      </label>
      <label className={lbl}>
        Large-order notice days (must be ≥ minimum notice)
        <input
          name="largeOrderNoticeDays"
          type="number"
          min={0}
          required
          defaultValue={largeOrderNoticeDays}
          className={field}
        />
      </label>
      <label className={lbl}>
        Large-order quantity threshold
        <input
          name="largeOrderQuantityThreshold"
          type="number"
          min={1}
          required
          defaultValue={largeOrderQuantityThreshold}
          className={field}
        />
      </label>
      <button type="submit" className={btn}>
        Save settings
      </button>
    </AdminActionForm>
  );
}
