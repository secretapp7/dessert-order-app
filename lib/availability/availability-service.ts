import "server-only";

import { OrderStatus } from "@prisma/client";

import { AVAILABILITY_KEYS } from "@/lib/availability/availability-keys";
import type {
  AvailabilityDayClientPayload,
  AvailabilityStatus,
} from "@/lib/availability/public-types";
import { prisma } from "@/lib/db/prisma";

export type { AvailabilityDayClientPayload, AvailabilityStatus } from "@/lib/availability/public-types";

export type AvailabilityDayResult = {
  status: AvailabilityStatus;
  /** YYYY-MM-DD UTC calendar date */
  dateIso: string;
  /** Effective max orders for this day (0 = unlimited). */
  maxOrders: number;
  usedSlots: number;
  remainingSlots: number;
  messageEn: string;
  messageAr: string;
};

export type ParsedAvailabilitySettings = {
  minimumNoticeDays: number;
  defaultDailyOrderLimit: number;
  largeOrderNoticeDays: number;
  largeOrderQuantityThreshold: number;
};

const DEFAULT_SETTINGS: ParsedAvailabilitySettings = {
  minimumNoticeDays: 2,
  defaultDailyOrderLimit: 5,
  largeOrderNoticeDays: 4,
  largeOrderQuantityThreshold: 5,
};

const MSG_FULL_EN =
  "This date is fully booked. Please choose another available date.";
const MSG_FULL_AR =
  "هذا التاريخ مكتمل الطلبات. يرجى اختيار تاريخ آخر متاح.";

const MSG_CLOSED_EN = "We are closed on this date.";
const MSG_CLOSED_AR = "نحن مغلقون في هذا التاريخ.";

const MSG_LARGE_EN =
  "Large orders require more preparation time. Please choose a later date.";
const MSG_LARGE_AR =
  "الطلبات الكبيرة تحتاج وقت تحضير أطول. يرجى اختيار تاريخ لاحق.";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC midnight for calendar YYYY-MM-DD */
export function utcMidnightFromIsoDay(isoDay: string): Date {
  const [yStr, moStr, dStr] = isoDay.split("-");
  const y = Number(yStr);
  const m = Number(moStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function utcIsoToday(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`;
}

export function utcCalendarDaysBetween(startMidnightUtc: Date, endMidnightUtc: Date): number {
  const ms = endMidnightUtc.getTime() - startMidnightUtc.getTime();
  return Math.round(ms / 86_400_000);
}

export function utcMidnightToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export function enumerateUtcIsoDatesInclusive(startIso: string, endIso: string): string[] {
  const start = utcMidnightFromIsoDay(startIso).getTime();
  const end = utcMidnightFromIsoDay(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return [];
  const out: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    const d = new Date(t);
    out.push(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`);
  }
  return out;
}

function parseNonNegInt(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function parsePosIntMin1(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

export async function loadAvailabilitySettings(): Promise<ParsedAvailabilitySettings> {
  const keys = [
    AVAILABILITY_KEYS.minimumNoticeDays,
    AVAILABILITY_KEYS.defaultDailyOrderLimit,
    AVAILABILITY_KEYS.largeOrderNoticeDays,
    AVAILABILITY_KEYS.largeOrderQuantityThreshold,
  ];
  const rows = await prisma.availabilitySetting.findMany({
    where: { key: { in: keys } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    minimumNoticeDays: parseNonNegInt(map.get(AVAILABILITY_KEYS.minimumNoticeDays), DEFAULT_SETTINGS.minimumNoticeDays),
    defaultDailyOrderLimit: parseNonNegInt(
      map.get(AVAILABILITY_KEYS.defaultDailyOrderLimit),
      DEFAULT_SETTINGS.defaultDailyOrderLimit,
    ),
    largeOrderNoticeDays: parseNonNegInt(
      map.get(AVAILABILITY_KEYS.largeOrderNoticeDays),
      DEFAULT_SETTINGS.largeOrderNoticeDays,
    ),
    largeOrderQuantityThreshold: parsePosIntMin1(
      map.get(AVAILABILITY_KEYS.largeOrderQuantityThreshold),
      DEFAULT_SETTINGS.largeOrderQuantityThreshold,
    ),
  };
}

function msgTooSoon(minDays: number): { en: string; ar: string } {
  if (minDays <= 1) {
    return {
      en: "Please order at least 1 day in advance.",
      ar: "يرجى الطلب قبل يوم واحد على الأقل.",
    };
  }
  return {
    en: `Please order at least ${minDays} days in advance.`,
    ar: `يرجى الطلب قبل ${minDays} أيام على الأقل.`,
  };
}

function closedHitForDay(
  dayStart: Date,
  dayEnd: Date,
  closed: { startsAt: Date; endsAt: Date; reasonEn: string | null; reasonAr: string | null }[],
): { reasonEn: string | null; reasonAr: string | null } | null {
  for (const c of closed) {
    if (c.startsAt <= dayEnd && c.endsAt >= dayStart) {
      return { reasonEn: c.reasonEn, reasonAr: c.reasonAr };
    }
  }
  return null;
}

function effectiveMaxOrders(
  settings: ParsedAvailabilitySettings,
  override: { maxOrders: number } | null | undefined,
): number {
  if (override?.maxOrders !== undefined && override.maxOrders !== null) {
    return override.maxOrders;
  }
  return settings.defaultDailyOrderLimit;
}

function capacitySlice(
  effectiveMax: number,
  usedSlots: number,
): { remainingSlots: number; capacityBlocked: boolean; fewSlots: boolean } {
  if (effectiveMax <= 0) {
    return { remainingSlots: 999_999, capacityBlocked: false, fewSlots: false };
  }
  const remainingSlots = Math.max(0, effectiveMax - usedSlots);
  const capacityBlocked = remainingSlots <= 0;
  const fewSlots = remainingSlots > 0 && remainingSlots <= 2;
  return { remainingSlots, capacityBlocked, fewSlots };
}

function decorateClosed(reasonEn: string | null, reasonAr: string | null): { en: string; ar: string } {
  const baseEn = MSG_CLOSED_EN;
  const baseAr = MSG_CLOSED_AR;
  return {
    en: reasonEn?.trim() ? `${baseEn} (${reasonEn.trim()})` : baseEn,
    ar: reasonAr?.trim() ? `${baseAr} (${reasonAr.trim()})` : baseAr,
  };
}

export function evaluateAvailabilityDay(params: {
  dateIso: string;
  quantity: number;
  settings: ParsedAvailabilitySettings;
  /** Closed ranges potentially overlapping this day */
  closedRanges: { startsAt: Date; endsAt: Date; reasonEn: string | null; reasonAr: string | null }[];
  usedSlots: number;
  /** Active override row for this UTC calendar date, if any */
  override: { maxOrders: number } | null;
}): AvailabilityDayResult {
  const { dateIso, quantity, settings, closedRanges, usedSlots, override } = params;

  const dayStart = utcMidnightFromIsoDay(dateIso);
  if (Number.isNaN(dayStart.getTime())) {
    return {
      status: "TOO_SOON",
      dateIso,
      maxOrders: 0,
      usedSlots: 0,
      remainingSlots: 0,
      messageEn: "Invalid date.",
      messageAr: "تاريخ غير صالح.",
    };
  }

  const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1);

  const closed = closedHitForDay(dayStart, dayEnd, closedRanges);
  if (closed) {
    const m = decorateClosed(closed.reasonEn, closed.reasonAr);
    return {
      status: "CLOSED",
      dateIso,
      maxOrders: 0,
      usedSlots,
      remainingSlots: 0,
      messageEn: m.en,
      messageAr: m.ar,
    };
  }

  const todayMid = utcMidnightToday();
  const ahead = utcCalendarDaysBetween(todayMid, dayStart);

  if (ahead < settings.minimumNoticeDays) {
    const m = msgTooSoon(settings.minimumNoticeDays);
    return {
      status: "TOO_SOON",
      dateIso,
      maxOrders: 0,
      usedSlots,
      remainingSlots: 0,
      messageEn: m.en,
      messageAr: m.ar,
    };
  }

  if (
    quantity >= settings.largeOrderQuantityThreshold &&
    ahead < settings.largeOrderNoticeDays
  ) {
    return {
      status: "LARGE_ORDER_NEEDS_MORE_NOTICE",
      dateIso,
      maxOrders: 0,
      usedSlots,
      remainingSlots: 0,
      messageEn: MSG_LARGE_EN,
      messageAr: MSG_LARGE_AR,
    };
  }

  const maxOrders = effectiveMaxOrders(settings, override);
  const { remainingSlots, capacityBlocked, fewSlots } = capacitySlice(maxOrders, usedSlots);

  if (capacityBlocked) {
    return {
      status: "FULLY_BOOKED",
      dateIso,
      maxOrders,
      usedSlots,
      remainingSlots: 0,
      messageEn: MSG_FULL_EN,
      messageAr: MSG_FULL_AR,
    };
  }

  if (fewSlots) {
    return {
      status: "FEW_SLOTS_LEFT",
      dateIso,
      maxOrders,
      usedSlots,
      remainingSlots,
      messageEn: `Almost full — only ${remainingSlots} spot${remainingSlots === 1 ? "" : "s"} left for this date.`,
      messageAr: `اقتربنا من الاكتمال — تبقى ${remainingSlots} طلبًا فقط لهذا التاريخ.`,
    };
  }

  return {
    status: "AVAILABLE",
    dateIso,
    maxOrders,
    usedSlots,
    remainingSlots,
    messageEn:
      maxOrders > 0
        ? `This date is available (${remainingSlots} spot${remainingSlots === 1 ? "" : "s"} left).`
        : "This date is available.",
    messageAr:
      maxOrders > 0
        ? `هذا التاريخ متاح (تبقى ${remainingSlots} طلبًا).`
        : "هذا التاريخ متاح.",
  };
}

async function loadClosedOverlapping(windowStart: Date, windowEnd: Date) {
  return prisma.closedDate.findMany({
    where: {
      isActive: true,
      startsAt: { lte: windowEnd },
      endsAt: { gte: windowStart },
    },
    select: {
      startsAt: true,
      endsAt: true,
      reasonEn: true,
      reasonAr: true,
    },
  });
}

async function loadOverridesInRange(windowStartDate: Date, windowEndDate: Date) {
  return prisma.dailyCapacityOverride.findMany({
    where: {
      isActive: true,
      date: { gte: windowStartDate, lte: windowEndDate },
    },
    select: { date: true, maxOrders: true },
  });
}

async function loadOrderCountsByDate(dayStart: Date, dayEnd: Date): Promise<Map<string, number>> {
  const grouped = await prisma.order.groupBy({
    by: ["dateNeeded"],
    where: {
      dateNeeded: { gte: dayStart, lte: dayEnd },
      orderStatus: { not: OrderStatus.CANCELLED },
    },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    const k = row.dateNeeded.toISOString().slice(0, 10);
    map.set(k, row._count._all);
  }
  return map;
}

/** Serialized payload safe for server actions → client */
export function serializeAvailabilityDay(r: AvailabilityDayResult): AvailabilityDayClientPayload {
  return {
    status: r.status,
    dateIso: r.dateIso,
    maxOrders: r.maxOrders,
    usedSlots: r.usedSlots,
    remainingSlots: r.remainingSlots,
    messageEn: r.messageEn,
    messageAr: r.messageAr,
  };
}

export async function getAvailabilityForDate(
  dateIso: string,
  quantity = 1,
): Promise<AvailabilityDayResult> {
  const settings = await loadAvailabilitySettings();
  const dayStart = utcMidnightFromIsoDay(dateIso);
  if (Number.isNaN(dayStart.getTime())) {
    return evaluateAvailabilityDay({
      dateIso,
      quantity,
      settings,
      closedRanges: [],
      usedSlots: 0,
      override: null,
    });
  }
  const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1);

  const [closedRanges, ovRow, usedSlots] = await Promise.all([
    loadClosedOverlapping(dayStart, dayEnd),
    prisma.dailyCapacityOverride.findUnique({
      where: { date: dayStart },
      select: { maxOrders: true, isActive: true },
    }),
    prisma.order.count({
      where: {
        dateNeeded: { gte: dayStart, lte: dayEnd },
        orderStatus: { not: OrderStatus.CANCELLED },
      },
    }),
  ]);

  const ovActive =
    ovRow && ovRow.isActive === true ? { maxOrders: ovRow.maxOrders } : null;

  return evaluateAvailabilityDay({
    dateIso,
    quantity,
    settings,
    closedRanges,
    usedSlots,
    override: ovActive,
  });
}

export async function getAvailabilityCalendarRange(
  startIso: string,
  endIso: string,
  quantity = 1,
): Promise<AvailabilityDayResult[]> {
  const days = enumerateUtcIsoDatesInclusive(startIso, endIso);
  if (days.length === 0) return [];

  const settings = await loadAvailabilitySettings();
  const windowStart = utcMidnightFromIsoDay(days[0]!);
  const windowEndDay = utcMidnightFromIsoDay(days[days.length - 1]!);
  const windowEnd = new Date(windowEndDay.getTime() + 86_400_000 - 1);

  const [closedRanges, overrides, countsMap] = await Promise.all([
    loadClosedOverlapping(windowStart, windowEnd),
    loadOverridesInRange(windowStart, windowEndDay),
    loadOrderCountsByDate(windowStart, new Date(windowEndDay.getTime() + 86_400_000 - 1)),
  ]);

  const ovMap = new Map<string, { maxOrders: number }>();
  for (const o of overrides) {
    ovMap.set(o.date.toISOString().slice(0, 10), { maxOrders: o.maxOrders });
  }

  return days.map((dateIso) => {
    const used = countsMap.get(dateIso) ?? 0;
    const ov = ovMap.get(dateIso) ?? null;
    return evaluateAvailabilityDay({
      dateIso,
      quantity,
      settings,
      closedRanges,
      usedSlots: used,
      override: ov,
    });
  });
}

export async function assertDateCanAcceptOrder(
  dateIso: string,
  quantity: number,
): Promise<{ ok: true } | { ok: false; messageEn: string; messageAr: string }> {
  const result = await getAvailabilityForDate(dateIso, quantity);
  const ok =
    result.status === "AVAILABLE" ||
    result.status === "FEW_SLOTS_LEFT";
  if (ok) return { ok: true };
  return { ok: false, messageEn: result.messageEn, messageAr: result.messageAr };
}

/** Shift a UTC calendar day (YYYY-MM-DD) by whole days (can be negative). */
export function addUtcCalendarDays(isoDay: string, deltaDays: number): string {
  const base = utcMidnightFromIsoDay(isoDay);
  if (Number.isNaN(base.getTime())) return isoDay;
  const d = new Date(base.getTime() + deltaDays * 86_400_000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
