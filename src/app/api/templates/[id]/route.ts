import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { templateDocumentId } from "@/lib/db/tenant";
import { templateSchema } from "@/lib/validation/schemas";
import { deleteImage } from "@/lib/cloudinary/client";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { normalizeReceiptTemplate, overlaySlotRectsAreValid } from "@/lib/receipt/template-rules";

export async function PATCH(request: Request, context: RouteContext<"/api/templates/[id]">) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { id } = await context.params;
    const input = templateSchema.partial().omit({ id: true }).parse(await request.json());
    const { templates } = await getCollections();
    const now = new Date();
    const documentId = templateDocumentId(businessId, id);
    const existing = await templates.findOne({ _id: documentId, businessId });
    if (!existing) return apiError("Template not found.", 404);
    if (input.overlayPublicId && !isBusinessAsset(input.overlayPublicId, businessId)) throw new Error("Forbidden");
    const normalized = normalizeReceiptTemplate({ ...existing, ...input, id });
    if (!overlaySlotRectsAreValid(normalized)) return apiError("Photo windows must stay inside the receipt and match the selected photo count.", 400);
    if (normalized.designMode === "image-overlay" && (!normalized.overlayImageUrl || !normalized.overlayPublicId)) return apiError("Image templates require an uploaded overlay.", 400);
    if (input.isDefault) await templates.updateMany({ businessId }, { $set: { isDefault: false, updatedAt: now } });
    const changes = { name: normalized.name, layout: normalized.layout, photoSlots: normalized.photoSlots, supportedPhotoSlots: normalized.supportedPhotoSlots, size: normalized.size, isDefault: normalized.isDefault, logoPlacement: normalized.logoPlacement, palette: normalized.palette, designMode: normalized.designMode, designStyle: normalized.designStyle, builtIn: existing.builtIn ?? false, overlayImageUrl: normalized.overlayImageUrl, overlayPublicId: normalized.overlayPublicId, overlaySlotRects: normalized.overlaySlotRects };
    const result = await templates.findOneAndUpdate({ _id: documentId, businessId }, { $set: { ...changes, updatedAt: now } }, { returnDocument: "after" });
    if (!result) return apiError("Template not found.", 404);
    if (existing.overlayPublicId && existing.overlayPublicId !== normalized.overlayPublicId) await deleteImage(existing.overlayPublicId).catch(() => undefined);
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
    if (template.overlayPublicId) await deleteImage(template.overlayPublicId).catch(() => undefined);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
