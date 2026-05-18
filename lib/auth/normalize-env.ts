/** Normalizes `.env`-style values (trim, outer quotes, line breaks some editors add). */
export function normalizeEnvString(raw: string | undefined): string {
  let v = raw?.trim() ?? "";
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/\r/g, "").replace(/\n/g, "");
}
