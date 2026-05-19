import { z } from "zod";

export const availabilitySettingsFormSchema = z
  .object({
    minimumNoticeDays: z.coerce.number().int().min(0),
    defaultDailyOrderLimit: z.coerce.number().int().min(0),
    largeOrderNoticeDays: z.coerce.number().int().min(0),
    largeOrderQuantityThreshold: z.coerce.number().int().min(1),
  })
  .refine((d) => d.largeOrderNoticeDays >= d.minimumNoticeDays, {
    message: "Large-order notice must be at least the regular minimum notice.",
    path: ["largeOrderNoticeDays"],
  });

const dtLocal = z
  .string()
  .trim()
  .min(1, "Start/end date/time required.")
  .refine((s) => !Number.isNaN(new Date(s).getTime()), "Invalid date/time.");

export const closedDateFormSchema = z
  .object({
    startsAt: dtLocal.transform((s) => new Date(s)),
    endsAt: dtLocal.transform((s) => new Date(s)),
    reasonEn: z
      .string()
      .max(800)
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
    reasonAr: z
      .string()
      .max(800)
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : undefined)),
    isActive: z.boolean(),
  })
  .refine((d) => d.endsAt >= d.startsAt, {
    message: "End must be on or after start.",
    path: ["endsAt"],
  });

export const capacityOverrideCreateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
    .transform((s) => {
      const parts = s.split("-").map(Number);
      const y = parts[0]!;
      const m = parts[1]!;
      const d = parts[2]!;
      return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
    }),
  maxOrders: z.coerce.number().int().min(0),
  noteEn: z
    .string()
    .max(800)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  noteAr: z
    .string()
    .max(800)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  isActive: z.boolean(),
});

export const capacityOverrideUpdateSchema = z.object({
  maxOrders: z.coerce.number().int().min(0),
  noteEn: z
    .string()
    .max(800)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  noteAr: z
    .string()
    .max(800)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  isActive: z.boolean(),
});
