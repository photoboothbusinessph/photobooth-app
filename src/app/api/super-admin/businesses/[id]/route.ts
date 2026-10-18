import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { deleteBusinessPermanently } from "@/lib/super-admin/delete-business";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await context.params;
    const result = await deleteBusinessPermanently(id);
    return result ? apiSuccess(result) : apiError("Business not found.", 404);
  } catch (error) { return handleApiError(error); }
}
