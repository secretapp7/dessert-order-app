/** Escape a CSV cell; wrap in quotes when needed. */
export function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build CSV with UTF-8 BOM for Excel Arabic compatibility. */
export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.map(escapeCsvCell).join(","))];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function csvDownloadHeaders(filename: string): HeadersInit {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
}
