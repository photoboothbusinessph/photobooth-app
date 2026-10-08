import "server-only";
import { cookies } from "next/headers";
import { getCollections, type AdminDocument } from "@/lib/db/collections";
import { getApplicationEnvironment } from "@/lib/server/env";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_DURATION_SECONDS,
  createAdminToken,
  verifyAdminToken,
} from "@/lib/auth/session-token";

export { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/lib/auth/session-token";

export async function createAdminSession(admin: AdminDocument) {
  const secureCookie = getApplicationEnvironment().NEXT_PUBLIC_APP_URL.startsWith("https://");
  const token = await createAdminToken(admin._id, admin.sessionVersion ?? 0);
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: secureCookie, path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS, priority: "high",
  });
}

export async function deleteAdminSession() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
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
