import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { deleteImage } from "@/lib/cloudinary/client";
import { getCollections } from "@/lib/db/collections";

export async function GET(_request: Request, context: RouteContext<"/api/sessions/[id]">) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const { sessions } = await getCollections();
    const session = await sessions.findOne({ _id: id, businessId });
    return session ? apiSuccess(session) : apiError("Session not found.", 404);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/sessions/[id]">) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const { sessions } = await getCollections();
    const session = await sessions.findOneAndDelete({ _id: id, businessId });
    if (!session) return apiError("Session not found.", 404);
    await Promise.allSettled([deleteImage(session.colorPublicId), deleteImage(session.bwPublicId)]);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
