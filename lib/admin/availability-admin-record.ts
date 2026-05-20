import type { ClosedDate, DailyCapacityOverride } from "@prisma/client";

import { dateToUtcDatetimeLocal, dateToUtcYmd } from "@/lib/admin/admin-serialize";

export type ClosedDateAdminClientRecord = {
  id: string;
  startsAtLocal: string;
  endsAtLocal: string;
  reasonEn: string | null;
  reasonAr: string | null;
  isActive: boolean;
};

export type CapacityOverrideAdminClientRecord = {
  id: string;
  dateYmd: string;
  maxOrders: number;
  noteEn: string | null;
  noteAr: string | null;
  isActive: boolean;
};

export function serializeClosedDateForAdmin(row: ClosedDate): ClosedDateAdminClientRecord {
  return {
    id: row.id,
    startsAtLocal: dateToUtcDatetimeLocal(row.startsAt),
    endsAtLocal: dateToUtcDatetimeLocal(row.endsAt),
    reasonEn: row.reasonEn,
    reasonAr: row.reasonAr,
    isActive: row.isActive,
  };
}

export function serializeCapacityOverrideForAdmin(
  row: DailyCapacityOverride,
): CapacityOverrideAdminClientRecord {
  return {
    id: row.id,
    dateYmd: dateToUtcYmd(row.date),
    maxOrders: row.maxOrders,
    noteEn: row.noteEn,
    noteAr: row.noteAr,
    isActive: row.isActive,
  };
}
