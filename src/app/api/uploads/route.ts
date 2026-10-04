import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/session";
import { deleteImage, uploadImage } from "@/lib/cloudinary/client";
import { assetUploadSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = assetUploadSchema.parse(await request.json());
    const uploaded = await uploadImage(input.dataUrl, input.kind);
    if (input.previousPublicId && input.previousPublicId !== uploaded.publicId) await deleteImage(input.previousPublicId);
    return apiSuccess(uploaded, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { publicId } = await request.json() as { publicId?: string };
    if (!publicId) return Response.json({ error: { message: "Asset ID is required." } }, { status: 400 });
    await deleteImage(publicId);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
