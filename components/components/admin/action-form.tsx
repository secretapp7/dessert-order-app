"use client";

import { useActionState, type ReactNode } from "react";

import type { AdminFormState } from "@/lib/admin/admin-form-state";

export type { AdminFormState };

export function AdminActionForm({
  action,
  children,
  className,
}: {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {} satisfies AdminFormState);

  return (
    <form action={formAction} className={className}>
      {state?.error ? (
        <p role="alert" className="mb-3 rounded-lg border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-cream)] px-2 py-1.5 text-xs text-[color:var(--brand-burgundy-soft)]">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p
          role="status"
          className="mb-3 rounded-lg border border-emerald-700/25 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-900"
        >
          {state.success}
        </p>
      ) : null}
      {children}
    </form>
  );
}
