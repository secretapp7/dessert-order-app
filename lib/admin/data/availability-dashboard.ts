import "server-only";

import { OrderStatus } from "@prisma/client";

import {
  addUtcCalendarDays,
  getAvailabilityCalendarRange,
  getAvailabilityForDate,
  utcIsoToday,
  utcMidnightFromIsoDay,
} from "@/lib/availability/availability-service";
import { prisma } from "@/lib/db/prisma";

export async function getAvailabilityDashboardBrief() {
  const todayIso = utcIsoToday();
  const tomorrowIso = addUtcCalendarDays(todayIso, 1);
  const scanEndIso = addUtcCalendarDays(todayIso, 44);

  const tomorrowStart = utcMidnightFromIsoDay(tomorrowIso);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 86_400_000 - 1);

  const [todayRow, tomorrowRow, scanFuture, upcomingClosed, tomorrowProductionRows] =
    await Promise.all([
      getAvailabilityForDate(todayIso, 1),
      getAvailabilityForDate(tomorrowIso, 1),
      getAvailabilityCalendarRange(addUtcCalendarDays(todayIso, 1), scanEndIso, 1),
      prisma.closedDate.findMany({
        where: {
          isActive: true,
          endsAt: { gte: utcMidnightFromIsoDay(todayIso) },
        },
        orderBy: { startsAt: "asc" },
        take: 6,
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          reasonEn: true,
          reasonAr: true,
        },
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            dateNeeded: { gte: tomorrowStart, lte: tomorrowEnd },
            orderStatus: { not: OrderStatus.CANCELLED },
          },
        },
        select: {
          productNameEn: true,
          sizeLabelEn: true,
          quantity: true,
        },
      }),
    ]);

  const nextFullyBooked =
    scanFuture.find((d) => d.status === "FULLY_BOOKED") ?? null;

  const prodMap = new Map<string, number>();
  for (const row of tomorrowProductionRows) {
    const k = `${row.productNameEn} · ${row.sizeLabelEn}`;
    prodMap.set(k, (prodMap.get(k) ?? 0) + row.quantity);
  }
  const tomorrowProduction = [...prodMap.entries()]
    .map(([label, qty]) => ({ label, qty }))
    .sort((a, b) => b.qty - a.qty);

  return {
    todayIso,
    tomorrowIso,
    todayRow,
    tomorrowRow,
    nextFullyBooked,
    upcomingClosed,
    tomorrowProduction,
  };
}
