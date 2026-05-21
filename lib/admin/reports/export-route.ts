import { NextResponse } from "next/server";

import { buildCsv, csvDownloadHeaders } from "@/lib/admin/csv-export";
import { parseReportMonthParam } from "@/lib/admin/validation/report-export";
import { getAdminSession } from "@/lib/auth/admin-session";

export type ExportQueryParams = {
  month?: string;
  start?: string;
  end?: string;
};

export function parseExportSearchParams(searchParams: URLSearchParams): ExportQueryParams {
  const monthRaw = searchParams.get("month");
  return {
    month: monthRaw ? parseReportMonthParam(monthRaw) : undefined,
    start: searchParams.get("start")?.trim() || undefined,
    end: searchParams.get("end")?.trim() || undefined,
  };
}

export async function requireAdminExportSession() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return null;
}

export function csvResponse(filename: string, headers: string[], rows: unknown[][]) {
  const body = buildCsv(headers, rows);
  return new NextResponse(body, { headers: csvDownloadHeaders(filename) });
}
