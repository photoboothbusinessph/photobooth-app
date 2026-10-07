import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { createAdminSession, requireAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "change-password", 5, 60_000);
    const adminSession = await requireAdmin();
    const input = changePasswordSchema.parse(await request.json());
    const { admins } = await getCollections();
    const admin = await admins.findOne({ _id: adminSession.adminId });
    if (!admin || !(await compare(input.currentPassword, admin.passwordHash)))
      return apiError("Current password is incorrect.", 400);
    if (input.currentPassword === input.newPassword) return apiError("Choose a different password.", 400);
    await admins.updateOne(
      { _id: admin._id },
      { $set: { passwordHash: await hash(input.newPassword, 12), mustChangePassword: false, updatedAt: new Date() }, $inc: { sessionVersion: 1 } },
    );
    await createAdminSession({ ...admin, sessionVersion: (admin.sessionVersion ?? 0) + 1, mustChangePassword: false });
    return apiSuccess({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
