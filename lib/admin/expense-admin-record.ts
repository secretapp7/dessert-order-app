import type { Prisma } from "@prisma/client";

import { dateToIsoOrNull, dateToUtcYmd, decimalToFormString } from "@/lib/admin/admin-serialize";

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

/** JSON-safe expense row for admin client forms. */
export type ExpenseAdminClientRecord = {
  id: string;
  category: ExpenseAdminRecord["category"];
  title: string;
  amountOmr: string;
  expenseDateYmd: string;
  notes: string | null;
  voidedAtIso: string | null;
  voidReason: string | null;
};

export function serializeExpenseForAdmin(row: ExpenseAdminRecord): ExpenseAdminClientRecord {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    amountOmr: decimalToFormString(row.amountOmr),
    expenseDateYmd: dateToUtcYmd(row.expenseDate),
    notes: row.notes,
    voidedAtIso: dateToIsoOrNull(row.voidedAt),
    voidReason: row.voidReason,
  };
}
