import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    try {
      await verifyAdminToken(token);
      return NextResponse.next();
    } catch {
      // Invalid and expired sessions return to login.
    }
  }
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/admin", "/admin/((?!login).*)", "/super-admin/:path*"] };
