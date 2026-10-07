import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { templateDocumentId } from "@/lib/db/tenant";
import { templateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: RouteContext<"/api/templates/[id]">) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const input = templateSchema.partial().omit({ id: true }).parse(await request.json());
    const { templates } = await getCollections();
    const now = new Date();
    const documentId = templateDocumentId(businessId, id);
    if (!(await templates.findOne({ _id: documentId, businessId }))) return apiError("Template not found.", 404);
    if (input.isDefault) await templates.updateMany({ businessId }, { $set: { isDefault: false, updatedAt: now } });
    const result = await templates.findOneAndUpdate({ _id: documentId, businessId }, { $set: { ...input, updatedAt: now } }, { returnDocument: "after" });
    if (!result) return apiError("Template not found.", 404);
    return apiSuccess({ ...result, id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/templates/[id]">) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const { templates } = await getCollections();
    const template = await templates.findOne({ _id: templateDocumentId(businessId, id), businessId });
    if (!template) return apiError("Template not found.", 404);
    if (template.isDefault) return apiError("Choose another default template before deleting this one.", 409);
    await templates.deleteOne({ _id: templateDocumentId(businessId, id), businessId });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
