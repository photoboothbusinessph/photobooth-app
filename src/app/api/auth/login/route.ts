import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { createAdminSession } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getSuperAdminBootstrapEnvironment } from "@/lib/server/env";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "admin-login", 5, 60_000);
    const input = loginSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const { admins, businesses } = await getCollections();
    let admin = await admins.findOne({ email });

    if (!admin && (await admins.countDocuments({ role: "super_admin" })) === 0) {
      const environment = getSuperAdminBootstrapEnvironment();
      if (
        environment.SUPER_ADMIN_EMAIL && environment.SUPER_ADMIN_PASSWORD &&
        email === environment.SUPER_ADMIN_EMAIL.toLowerCase() &&
        input.password === environment.SUPER_ADMIN_PASSWORD
      ) {
        const now = new Date();
        const passwordHash = await hash(input.password, 12);
        await admins.updateOne({ email }, { $setOnInsert: { _id: crypto.randomUUID(), email, passwordHash, role: "super_admin", businessId: null, isEnabled: true, mustChangePassword: true, sessionVersion: 0, createdAt: now, updatedAt: now } }, { upsert: true });
        admin = await admins.findOne({ email });
      }
    }

    if (!admin || !(await compare(input.password, admin.passwordHash)))
      return apiError("Invalid email or password.", 401);
    if (admin.isEnabled === false) return apiError("This account is disabled.", 403);
    if (!admin.role || (admin.role === "business_admin" && !admin.businessId)) return apiError("Account migration is required before login.", 403);
    const role = admin.role;
    const configuredBusiness = role === "business_admin" && admin.businessId ? await businesses.findOne({ _id: admin.businessId }, { projection: { isConfigured: 1 } }) : null;
    if (role === "business_admin" && !configuredBusiness) return apiError("This account is not linked to an active business. Contact the super admin.", 403);
    await createAdminSession(admin);
    return apiSuccess({ authenticated: true, role, mustChangePassword: Boolean(admin.mustChangePassword), requiresSetup: role === "business_admin" && !configuredBusiness?.isConfigured });
  } catch (error) {
    return handleApiError(error);
  }
}
