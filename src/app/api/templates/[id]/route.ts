import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { templateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: Request, context: RouteContext<"/api/templates/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const input = templateSchema.partial().omit({ id: true }).parse(await request.json());
    const { templates } = await getCollections();
    const now = new Date();
    if (input.isDefault) await templates.updateMany({ businessId: "default" }, { $set: { isDefault: false, updatedAt: now } });
    const result = await templates.findOneAndUpdate({ _id: id, businessId: "default" }, { $set: { ...input, updatedAt: now } }, { returnDocument: "after" });
    if (!result) return apiError("Template not found.", 404);
    return apiSuccess({ ...result, id: result._id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/templates/[id]">) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const { templates } = await getCollections();
    const template = await templates.findOne({ _id: id, businessId: "default" });
    if (!template) return apiError("Template not found.", 404);
    if (template.isDefault) return apiError("Choose another default template before deleting this one.", 409);
    await templates.deleteOne({ _id: id, businessId: "default" });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
