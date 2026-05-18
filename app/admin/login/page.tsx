import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/admin-session";

import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin login · Coco Treats",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const existing = await getAdminSession();
  if (existing) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const nextRaw = typeof sp.next === "string" ? sp.next : "/admin";
  const nextPath =
    nextRaw.startsWith("/admin") && !nextRaw.startsWith("//") && !nextRaw.includes("\n")
      ? nextRaw
      : "/admin";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--card-beige)] p-6 shadow-lg">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-gold-muted)]">
          Coco Treats
        </p>
        <h1 className="mt-2 text-center text-xl font-bold text-[color:var(--accent-cocoa)]">
          Admin sign in
        </h1>
        <p className="mt-1 text-center text-xs text-[color:var(--muted-text)]">
          Private area — keep credentials secret.
        </p>
        <div className="mt-6">
          <AdminLoginForm nextPath={nextPath} />
        </div>
      </div>
    </div>
  );
}
