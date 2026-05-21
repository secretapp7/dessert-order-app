import { z } from "zod";

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

export const reportMonthQuerySchema = z.object({
  month: z.string().regex(monthRegex, "Month must be YYYY-MM.").optional(),
});

export const reportDateRangeQuerySchema = z.object({
  start: z.string().regex(ymdRegex, "Start must be YYYY-MM-DD.").optional(),
  end: z.string().regex(ymdRegex, "End must be YYYY-MM-DD.").optional(),
  month: z.string().regex(monthRegex, "Month must be YYYY-MM.").optional(),
});

export type ReportMonthQuery = z.infer<typeof reportMonthQuerySchema>;

export function parseReportMonthParam(month?: string): string | undefined {
  const parsed = reportMonthQuerySchema.safeParse({ month });
  if (!parsed.success) return undefined;
  return parsed.data.month;
}
