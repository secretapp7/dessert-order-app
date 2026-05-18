import "server-only";

import { ExpenseCategory, Prisma } from "@prisma/client";

import { expenseAdminRecordSelect, type ExpenseAdminRecord } from "@/lib/admin/expense-admin-record";
import { prisma } from "@/lib/db/prisma";

export type ExpenseListFilters = {
  q?: string;
  category?: ExpenseCategory;
  from?: Date;
  to?: Date;
  void?: "active" | "voided" | "all";
  sort: "newest" | "updated" | "amount" | "date";
};

function buildWhere(filters: ExpenseListFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};
  const v = filters.void ?? "active";
  if (v === "active") where.voidedAt = null;
  if (v === "voided") where.voidedAt = { not: null };
  if (filters.category) where.category = filters.category;
  if (filters.q?.trim()) {
    const s = filters.q.trim();
    where.OR = [{ title: { contains: s, mode: "insensitive" } }, { notes: { contains: s, mode: "insensitive" } }];
  }
  if (filters.from || filters.to) {
    where.expenseDate = {};
    if (filters.from) where.expenseDate.gte = filters.from;
    if (filters.to) where.expenseDate.lte = filters.to;
  }
  return where;
}

export async function getExpensesForAdmin(filters: ExpenseListFilters) {
  const where = buildWhere(filters);
  let orderBy: Prisma.ExpenseOrderByWithRelationInput | Prisma.ExpenseOrderByWithRelationInput[];
  switch (filters.sort) {
    case "amount":
      orderBy = { amountOmr: "desc" };
      break;
    case "date":
      orderBy = [{ expenseDate: "desc" }, { createdAt: "desc" }];
      break;
    case "updated":
      orderBy = { updatedAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [rows, totals] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy,
      select: expenseAdminRecordSelect,
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amountOmr: true },
      _count: true,
    }),
  ]);

  const filteredTotalAmount = totals._sum.amountOmr ?? new Prisma.Decimal(0);

  return { rows, filteredTotalAmount, filteredRowCount: totals._count };
}

export async function getExpenseForAdmin(id: string): Promise<ExpenseAdminRecord | null> {
  return prisma.expense.findUnique({
    where: { id },
    select: expenseAdminRecordSelect,
  });
}
