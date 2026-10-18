import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { AssetValidationError, deleteImage, uploadImage, validateTemplateOverlay } from "@/lib/cloudinary/client";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { assetUploadSchema } from "@/lib/validation/schemas";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "asset-upload", 20, 60_000);
    const { businessId } = await requireBusinessAdmin();
    const input = assetUploadSchema.parse(await request.json());
    if (input.previousPublicId && !isBusinessAsset(input.previousPublicId, businessId)) throw new Error("Forbidden");
    if (input.kind === "template-overlay") {
      if (!input.photoSlots) return Response.json({ error: { message: "Photo slot count is required." } }, { status: 400 });
      validateTemplateOverlay(input.dataUrl, input.photoSlots);
    }
    const uploaded = await uploadImage(input.dataUrl, `${businessId}/${input.kind}`);
    if (input.previousPublicId && input.previousPublicId !== uploaded.publicId) await deleteImage(input.previousPublicId);
    return apiSuccess(uploaded, { status: 201 });
  } catch (error) {
    if (error instanceof AssetValidationError) return apiError(error.message, 400);
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    enforceRateLimit(request, "asset-delete", 20, 60_000);
    const { businessId } = await requireBusinessAdmin();
    const { publicId } = await request.json() as { publicId?: string };
    if (!publicId) return Response.json({ error: { message: "Asset ID is required." } }, { status: 400 });
    if (!isBusinessAsset(publicId, businessId)) throw new Error("Forbidden");
    await deleteImage(publicId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
