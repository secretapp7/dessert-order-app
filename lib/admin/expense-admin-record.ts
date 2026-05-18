import type { Prisma } from "@prisma/client";

/** Fields loaded for expense list/detail admin UIs (void + timestamps included). */
export const expenseAdminRecordSelect = {
  id: true,
  category: true,
  title: true,
  amountOmr: true,
  expenseDate: true,
  notes: true,
  voidedAt: true,
  voidReason: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ExpenseSelect;

export type ExpenseAdminRecord = Prisma.ExpenseGetPayload<{ select: typeof expenseAdminRecordSelect }>;
