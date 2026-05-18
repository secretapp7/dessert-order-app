import Link from "next/link";

import { ExpenseCreateForm } from "@/components/admin/expenses/expense-forms";

export default async function AdminNewExpensePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent-cocoa)]">New expense</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-text)]">
            Amounts must be positive. Expense date uses UTC calendar day (YYYY-MM-DD).
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
        <ExpenseCreateForm />
      </section>
    </div>
  );
}
