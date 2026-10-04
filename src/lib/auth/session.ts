import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getServerEnvironment } from "@/lib/server/env";

export const ADMIN_SESSION_COOKIE = "photobooth-admin-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function secretKey() {
  return new TextEncoder().encode(getServerEnvironment().AUTH_SECRET);
}

export async function createAdminSession(adminId: string, email: string) {
  const secureCookie = getServerEnvironment().NEXT_PUBLIC_APP_URL.startsWith("https://");
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    priority: "high",
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (payload.role !== "admin" || !payload.sub || typeof payload.email !== "string") throw new Error("Unauthorized");
  return { adminId: payload.sub, email: payload.email };
}

export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error("Unauthorized");
  try {
    return await verifyAdminToken(token);
  } catch {
    throw new Error("Unauthorized");
  }
}
