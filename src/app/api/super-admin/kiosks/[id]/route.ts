import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await context.params;
    const { kioskDevices } = await getCollections();
    const result = await kioskDevices.updateOne({ _id: id }, { $set: { isEnabled: false } });
    return result.matchedCount ? apiSuccess({ revoked: true }) : apiError("Kiosk not found.", 404);
  } catch (error) { return handleApiError(error); }
}
