"use client";

import { useActionState } from "react";

import { adminLoginAction, type LoginFormState } from "./actions";

type Props = {
  nextPath: string;
};

export function AdminLoginForm({ nextPath }: Props) {
  const [state, formAction, pending] = useActionState(adminLoginAction, {} satisfies LoginFormState);

  return (
    <form action={formAction} className="mx-auto w-full max-w-md space-y-4">
      <input type="hidden" name="next" value={nextPath} />

      <label className="block">
        <span className="text-xs font-semibold text-[color:var(--muted-text)]">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={pending}
          className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold-muted)]/35 disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-[color:var(--muted-text)]">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--card-cream)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--brand-gold)] focus:ring-2 focus:ring-[color:var(--brand-gold-muted)]/35 disabled:opacity-60"
        />
      </label>

      {state?.error ? (
        <p role="alert" className="rounded-lg border border-[color:var(--brand-burgundy-soft)]/40 bg-[color:var(--card-beige)] px-3 py-2 text-xs text-[color:var(--brand-burgundy-soft)]">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[color:var(--brand-burgundy)] py-3 text-sm font-semibold text-[color:var(--card-cream)] shadow hover:brightness-[1.05] disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
