import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  try {
    const adminSession = await requireAdmin();
    const input = changePasswordSchema.parse(await request.json());
    const { admins } = await getCollections();
    const admin = await admins.findOne({ _id: adminSession.adminId });
    if (!admin || !(await compare(input.currentPassword, admin.passwordHash)))
      return apiError("Current password is incorrect.", 400);
    await admins.updateOne(
      { _id: admin._id },
      { $set: { passwordHash: await hash(input.newPassword, 12), updatedAt: new Date() } },
    );
    return apiSuccess({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
