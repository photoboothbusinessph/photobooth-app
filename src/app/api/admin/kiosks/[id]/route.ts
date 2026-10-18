import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const { kioskDevices } = await getCollections();
    const result = await kioskDevices.updateOne({ _id: id, businessId }, { $set: { isEnabled: false } });
    return result.matchedCount ? apiSuccess({ revoked: true }) : apiError("Kiosk not found.", 404);
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const { kioskDevices } = await getCollections();
    const result = await kioskDevices.deleteOne({ _id: id, businessId });
    return result.deletedCount ? apiSuccess({ deleted: true }) : apiError("Kiosk not found.", 404);
  } catch (error) { return handleApiError(error); }
}
