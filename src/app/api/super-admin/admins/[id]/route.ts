import { hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createTemporaryPassword } from "@/lib/auth/temporary-password";
import { getCollections } from "@/lib/db/collections";

const actionSchema = z.discriminatedUnion("action", [z.object({ action: z.literal("enable") }), z.object({ action: z.literal("disable") }), z.object({ action: z.literal("reset-password") })]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await context.params;
    const { action } = actionSchema.parse(await request.json());
    const { admins } = await getCollections();
    const admin = await admins.findOne({ _id: id, role: "business_admin" });
    if (!admin) return apiError("Admin not found.", 404);
    const temporaryPassword = action === "reset-password" ? createTemporaryPassword() : null;
    const update = action === "reset-password" ? { passwordHash: await hash(temporaryPassword!, 12), mustChangePassword: true } : { isEnabled: action === "enable" };
    await admins.updateOne({ _id: id, role: "business_admin" }, { $set: { ...update, updatedAt: new Date() }, $inc: { sessionVersion: 1 } });
    return apiSuccess({ updated: true, temporaryPassword });
  } catch (error) { return handleApiError(error); }
}
