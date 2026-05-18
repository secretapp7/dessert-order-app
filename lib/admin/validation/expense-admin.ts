import { z } from "zod";

import { ExpenseCategory } from "@prisma/client";

const moneyPositive = z.coerce
  .number()
  .refine((n) => Number.isFinite(n), "Amount must be a valid number.")
  .gt(0, "Amount must be greater than zero.")
  .max(999_999_999.999, "Amount is too large.");

export const expenseCoreSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  title: z.string().trim().min(1, "Title is required.").max(200),
  amountOmr: moneyPositive,
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD for the expense date.")
    .transform((s) => {
      const parts = s.split("-").map(Number);
      const y = parts[0]!;
      const m = parts[1]!;
      const d = parts[2]!;
      return new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
    }),
  notes: z
    .string()
    .max(4000)
    .optional()
    .transform((v) => (v == null ? undefined : v.trim() === "" ? undefined : v.trim())),
});

/** @deprecated Use expenseCoreSchema */
export const expenseInputSchema = expenseCoreSchema;

export const expenseVoidSchema = z.object({
  reason: z
    .string()
    .max(2000)
    .optional()
    .transform((v) => v?.trim() || undefined),
});
