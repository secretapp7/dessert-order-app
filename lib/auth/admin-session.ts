import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_S } from "./admin-constants";
import { getJwtPayload, signAdminJwt } from "./admin-jwt";

export type AdminSession = { email: string };

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const payload = await getJwtPayload(token);
  if (!payload?.sub) return null;
  return { email: payload.sub };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function setAdminSessionCookie(email: string): Promise<{ ok: boolean }> {
  const token = await signAdminJwt(email);
  if (!token) return { ok: false };
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_S,
  });
  return { ok: true };
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
