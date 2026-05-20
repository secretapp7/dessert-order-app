/** OMR amount for admin form defaultValue (3 decimal places). */
export function decimalToFormString(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(3) : "0.000";
}

/** UTC calendar day `YYYY-MM-DD` for `<input type="date">`. */
export function dateToUtcYmd(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** UTC `datetime-local` value `YYYY-MM-DDTHH:mm`. */
export function dateToUtcDatetimeLocal(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function dateToIsoOrNull(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}
