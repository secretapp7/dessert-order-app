"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import type { AdminFormState } from "@/lib/admin/admin-form-state";
import { expenseCoreSchema, expenseVoidSchema } from "@/lib/admin/validation/expense-admin";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type ExpenseFormState = AdminFormState;

export type CreateExpenseResult = { ok: true; expenseId: string } | { ok: false; error: string };

function friendlyErr(e: unknown): string {
  if (e instanceof Prisma.PrismaClientKnownRequestError) return "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

function revalidateExpensePaths(id: string) {
  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports/profit");
}

function parseExpense(formData: FormData) {
  return {
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    amountOmr: String(formData.get("amountOmr") ?? ""),
    expenseDate: String(formData.get("expenseDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createExpenseAction(formData: FormData): Promise<CreateExpenseResult> {
  await requireAdmin();
  const parsed = expenseCoreSchema.safeParse(parseExpense(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const row = await prisma.expense.create({
      data: {
        category: parsed.data.category,
        title: parsed.data.title.trim(),
        amountOmr: new Prisma.Decimal(String(parsed.data.amountOmr)),
        expenseDate: parsed.data.expenseDate,
        notes: parsed.data.notes ?? null,
        voidedAt: null,
        voidReason: null,
      },
    });
    revalidateExpensePaths(row.id);
    return { ok: true, expenseId: row.id };
  } catch (e) {
    return { ok: false, error: friendlyErr(e) };
  }
}

export async function updateExpenseAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing expense." };
  const parsed = expenseCoreSchema.safeParse(parseExpense(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const exists = await prisma.expense.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return { ok: false, error: "Expense not found." };
    await prisma.expense.update({
      where: { id },
      data: {
        category: parsed.data.category,
        title: parsed.data.title.trim(),
        amountOmr: new Prisma.Decimal(String(parsed.data.amountOmr)),
        expenseDate: parsed.data.expenseDate,
        notes: parsed.data.notes ?? null,
      },
    });
    revalidateExpensePaths(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyErr(e) };
  }
}

export async function voidExpenseAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing expense." };
  const reasonParsed = expenseVoidSchema.safeParse({ reason: String(formData.get("voidReason") ?? "") });
  if (!reasonParsed.success) {
    return { ok: false, error: reasonParsed.error.issues.map((i) => i.message).join(" ") };
  }
  try {
    const row = await prisma.expense.findUnique({ where: { id }, select: { voidedAt: true } });
    if (!row) return { ok: false, error: "Expense not found." };
    if (row.voidedAt) return { ok: false, error: "This expense is already voided." };
    await prisma.expense.update({
      where: { id },
      data: {
        voidedAt: new Date(),
        voidReason: reasonParsed.data.reason ?? null,
      },
    });
    revalidateExpensePaths(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyErr(e) };
  }
}

export async function deleteExpenseAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const confirmTitle = String(formData.get("confirmTitle") ?? "").trim();
  if (!id) return { ok: false, error: "Missing expense." };
  if (!formData.has("confirmDelete")) {
    return { ok: false, error: "Confirm deletion before continuing." };
  }
  try {
    const row = await prisma.expense.findUnique({ where: { id }, select: { title: true } });
    if (!row) return { ok: false, error: "Expense not found." };
    if (confirmTitle.localeCompare(row.title.trim(), undefined, { sensitivity: "accent" }) !== 0) {
      return { ok: false, error: 'Title confirmation must match exactly.' };
    }
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/admin/expenses");
    revalidatePath(`/admin/expenses/${id}`);
    revalidatePath("/admin");
    revalidatePath("/admin/reports/profit");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyErr(e) };
  }
}

function redirectToExpense(id: string): never {
  redirect(`/admin/expenses/${id}`);
}

function redirectExpenseList(): never {
  redirect("/admin/expenses");
}

export async function createExpenseFormAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const r = await createExpenseAction(formData);
  if (!r.ok) return { error: r.error };
  redirectToExpense(r.expenseId);
}

export async function updateExpenseFormAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const r = await updateExpenseAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing expense." };
  redirectToExpense(id);
}

export async function voidExpenseFormAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const r = await voidExpenseAction(formData);
  const id = String(formData.get("id") ?? "");
  if (!r.ok) return { error: r.error };
  if (!id) return { error: "Missing expense." };
  redirectToExpense(id);
}

export async function deleteExpenseFormAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const r = await deleteExpenseAction(formData);
  if (!r.ok) return { error: r.error };
  redirectExpenseList();
}
