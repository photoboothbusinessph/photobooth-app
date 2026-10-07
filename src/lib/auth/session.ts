import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { getCollections, type AdminDocument } from "@/lib/db/collections";
import { getServerEnvironment } from "@/lib/server/env";

export const ADMIN_SESSION_COOKIE = "photobooth-admin-session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function secretKey() {
  return new TextEncoder().encode(getServerEnvironment().AUTH_SECRET);
}

export async function createAdminSession(admin: AdminDocument) {
  const secureCookie = getServerEnvironment().NEXT_PUBLIC_APP_URL.startsWith("https://");
  const token = await new SignJWT({ version: admin.sessionVersion ?? 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin._id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: secureCookie, path: "/",
    maxAge: SESSION_DURATION_SECONDS, priority: "high",
  });
}

export async function deleteAdminSession() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  if (!payload.sub || typeof payload.version !== "number") throw new Error("Unauthorized");
  return { adminId: payload.sub, version: payload.version };
}

export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) throw new Error("Unauthorized");
  let session: Awaited<ReturnType<typeof verifyAdminToken>>;
  try { session = await verifyAdminToken(token); } catch { throw new Error("Unauthorized"); }
  const { admins, businesses } = await getCollections();
  const admin = await admins.findOne({ _id: session.adminId });
  if (!admin || admin.isEnabled === false || (admin.sessionVersion ?? 0) !== session.version) throw new Error("Unauthorized");
  if (!admin.role || (admin.role === "business_admin" && !admin.businessId)) throw new Error("Forbidden");
  const role = admin.role;
  const businessId = role === "business_admin" ? admin.businessId : null;
  if (businessId && !(await businesses.findOne({ _id: businessId }, { projection: { _id: 1 } }))) throw new Error("Forbidden");
  return { adminId: admin._id, email: admin.email, role, businessId, mustChangePassword: Boolean(admin.mustChangePassword) };
}

export async function requireBusinessAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "business_admin" || !admin.businessId || admin.mustChangePassword) throw new Error("Forbidden");
  return { ...admin, businessId: admin.businessId };
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin" || admin.mustChangePassword) throw new Error("Forbidden");
  return admin;
}
