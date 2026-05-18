"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { normalizeEnvString } from "@/lib/auth/normalize-env";
import { setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/auth/admin-session";

export type LoginFormState = {
  error?: string;
};

function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/admin") || raw.startsWith("//") || raw.includes("\r")) {
    return "/admin";
  }
  return raw.split("\n")[0] ?? "/admin";
}

export async function adminLoginAction(
  _prev: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const emailInput = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  // Read from process.env only (matches Next/Turbopack server bundle for server actions).
  const envEmailRaw = process.env.ADMIN_EMAIL;
  const envHashRaw = process.env.ADMIN_PASSWORD_HASH;
  const envSecretRaw = process.env.ADMIN_SESSION_SECRET;

  const expectedEmail = normalizeEnvString(envEmailRaw).toLowerCase();
  const hash = normalizeEnvString(envHashRaw);
  const sessionSecret = normalizeEnvString(envSecretRaw);

  if (
    !expectedEmail ||
    !hash ||
    hash.length < 10 ||
    !sessionSecret ||
    sessionSecret.length < 32
  ) {
    console.error("[admin] Missing or weak ADMIN_EMAIL, ADMIN_PASSWORD_HASH, or ADMIN_SESSION_SECRET");
    return { error: "Login is not available. Check server configuration." };
  }

  if (emailInput !== expectedEmail) {
    return { error: "Invalid email or password." };
  }

  const passwordOk = await compare(password, hash);
  if (!passwordOk) {
    return { error: "Invalid email or password." };
  }

  const canonicalEmail = normalizeEnvString(envEmailRaw);
  const { ok } = await setAdminSessionCookie(canonicalEmail);
  if (!ok) {
    return { error: "Could not create session. Check ADMIN_SESSION_SECRET." };
  }

  redirect(next);
}

export async function adminLogoutAction() {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
