import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { createTemporaryPassword } from "@/lib/auth/temporary-password";
import { getCollections } from "@/lib/db/collections";
import { createAdminSchema } from "@/lib/validation/management";

export async function GET() {
  try {
    await requireSuperAdmin();
    const { admins } = await getCollections();
    return apiSuccess(await admins.find({ role: "business_admin" }, { projection: { _id: 1, email: 1, businessId: 1, isEnabled: 1, mustChangePassword: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray());
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const input = createAdminSchema.parse(await request.json());
    const { admins, businesses } = await getCollections();
    if (!(await businesses.findOne({ _id: input.businessId }))) return apiError("Business not found.", 404);
    if (await admins.findOne({ email: input.email })) return apiError("Email is already in use.", 409);
    const temporaryPassword = createTemporaryPassword();
    const now = new Date();
    const id = randomUUID();
    await admins.insertOne({ _id: id, email: input.email, passwordHash: await hash(temporaryPassword, 12), role: "business_admin", businessId: input.businessId, isEnabled: true, mustChangePassword: true, sessionVersion: 0, createdAt: now, updatedAt: now });
    return apiSuccess({ id, temporaryPassword }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
