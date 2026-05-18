import Link from "next/link";
import { notFound } from "next/navigation";

import { ExpenseEditForm } from "@/components/admin/expenses/expense-forms";
import { getExpenseForAdmin } from "@/lib/admin/data/expense-queries";

export default async function AdminEditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseForAdmin(id);
  if (!expense) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">Edit expense</h1>
          <p className="mt-1 text-xs text-[color:var(--muted-text)]">
            {expense.category} · {expense.expenseDate.toISOString().slice(0, 10)} UTC
            {expense.voidedAt ? " · voided (totals exclude this row)" : ""}
          </p>
        </div>
        <Link
          href="/admin/expenses"
          className="rounded-xl border border-[color:var(--border-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--brand-burgundy)] hover:bg-[color:var(--card-cream)]"
        >
          Back to list
        </Link>
      </div>

      <section className="rounded-2xl border border-[color:var(--border-soft)] bg-white/80 p-4 shadow-sm">
        <ExpenseEditForm expense={expense} />
      </section>
    </div>
  );
}
