"use client";

import { ExpenseCategory } from "@prisma/client";

import { AdminActionForm } from "@/components/admin/action-form";
import type { ExpenseAdminClientRecord } from "@/lib/admin/expense-admin-record";
import {
  createExpenseFormAction,
  deleteExpenseFormAction,
  updateExpenseFormAction,
  voidExpenseFormAction,
} from "@/lib/admin/actions/expense-actions";

const field =
  "mt-1 w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-2 py-1.5 text-sm";
const lbl = "block text-[11px] font-semibold text-[color:var(--muted-text)]";
const btn =
  "rounded-lg bg-[color:var(--brand-burgundy)] px-3 py-2 text-xs font-semibold text-[color:var(--card-cream)]";

function ymdUtc(d: Date) {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ExpenseCreateForm() {
  const today = ymdUtc(new Date());
  return (
    <AdminActionForm action={createExpenseFormAction} className="max-w-xl space-y-3">
      <label className={lbl}>
        Category
        <select name="category" required className={field}>
          {Object.values(ExpenseCategory).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className={lbl}>
        Title
        <input name="title" required className={field} />
      </label>
      <label className={lbl}>
        Amount (OMR)
        <input name="amountOmr" required inputMode="decimal" className={field} />
      </label>
      <label className={lbl}>
        Expense date (UTC)
        <input name="expenseDate" type="date" required defaultValue={today} className={field} />
      </label>
      <label className={lbl}>
        Notes (optional)
        <textarea name="notes" rows={3} className={field} />
      </label>
      <button type="submit" className={btn}>
        Save expense
      </button>
    </AdminActionForm>
  );
}

export function ExpenseEditForm({ expense }: { expense: ExpenseAdminClientRecord }) {
  const voided = Boolean(expense.voidedAtIso);
  return (
    <div className="space-y-8">
      {!voided ? (
        <>
          <AdminActionForm action={updateExpenseFormAction} className="max-w-xl space-y-3">
            <input type="hidden" name="id" value={expense.id} />
            <label className={lbl}>
              Category
              <select name="category" required defaultValue={expense.category} className={field}>
                {Object.values(ExpenseCategory).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className={lbl}>
              Title
              <input name="title" required defaultValue={expense.title} className={field} />
            </label>
            <label className={lbl}>
              Amount (OMR)
              <input name="amountOmr" required inputMode="decimal" defaultValue={expense.amountOmr} className={field} />
            </label>
            <label className={lbl}>
              Expense date (UTC)
              <input name="expenseDate" type="date" required defaultValue={expense.expenseDateYmd} className={field} />
            </label>
            <label className={lbl}>
              Notes (optional)
              <textarea name="notes" rows={3} defaultValue={expense.notes ?? ""} className={field} />
            </label>
            <button type="submit" className={btn}>
              Save changes
            </button>
          </AdminActionForm>

          <div className="max-w-xl space-y-2 rounded-xl border border-amber-800/35 bg-[color:var(--card-cream)] p-4">
            <h2 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
              Void expense
            </h2>
            <p className="text-[11px] text-[color:var(--muted-text)]">
              Voiding hides an entry from totals while keeping audit history (recommended vs deleting real spend).
            </p>
            <AdminActionForm action={voidExpenseFormAction} className="space-y-2">
              <input type="hidden" name="id" value={expense.id} />
              <label className={lbl}>
                Reason (optional)
                <textarea name="voidReason" rows={2} className={field} />
              </label>
              <button type="submit" className="rounded-lg border-2 border-amber-900/35 bg-white px-3 py-2 text-xs font-bold text-amber-950">
                Void expense
              </button>
            </AdminActionForm>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2 text-sm text-[color:var(--muted-text)]">
          Voided expense — totals exclude this row.
          {expense.voidReason ? ` Reason: ${expense.voidReason}` : ""}
        </p>
      )}

      <div className="max-w-xl space-y-2 rounded-xl border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] p-4">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--brand-gold-muted)]">
          Delete permanently
        </h2>
        <p className="text-[11px] text-[color:var(--muted-text)]">
          For duplicates or mistaken test entries only. Retype title <span className="font-semibold">{expense.title}</span> exactly.
        </p>
        <AdminActionForm action={deleteExpenseFormAction} className="space-y-2">
          <input type="hidden" name="id" value={expense.id} />
          <label className={lbl}>
            Confirm title (exact match)
            <input name="confirmTitle" autoComplete="off" className={field} />
          </label>
          <label className={`${lbl} flex items-start gap-2 text-[11px]`}>
            <input type="checkbox" name="confirmDelete" required className="mt-1 h-4 w-4" />I understand this cannot be
            undone.
          </label>
          <button
            type="submit"
            className="rounded-lg border-2 border-[color:var(--brand-burgundy-soft)] bg-white px-3 py-2 text-xs font-bold text-[color:var(--brand-burgundy)]"
          >
            Delete expense permanently
          </button>
        </AdminActionForm>
      </div>
    </div>
  );
}
