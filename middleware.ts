import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { verifyAdminJwt } from "@/lib/auth/admin-jwt";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/admin-constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const ok = await verifyAdminJwt(token);
  if (!ok) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
