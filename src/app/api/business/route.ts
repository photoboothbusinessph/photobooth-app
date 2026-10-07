import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug } from "@/lib/db/tenant";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { businessSchema } from "@/lib/validation/schemas";
import { business, defaultPalette } from "@/config/mock-data";

export async function GET(request: Request) {
  try {
    const { businesses } = await getCollections();
    const slug = new URL(request.url).searchParams.get("slug");
    const businessId = slug ? (await getBusinessBySlug(slug))?._id : (await requireBusinessAdmin()).businessId;
    if (!businessId) return Response.json({ error: { message: "Business not found." } }, { status: 404 });
    const document = await businesses.findOne({ _id: businessId });
    return apiSuccess(
      document ?? (businessId === "default" ? {
        _id: businessId,
        isConfigured: false,
        branding: { ...business, logoDataUrl: null },
        palette: defaultPalette,
        socialUrl: null,
        socialQrUrl: null,
        socialQrPublicId: null,
        logoPublicId: null,
      } : null),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const input = businessSchema.parse(await request.json());
    const { businesses } = await getCollections();
    if (input.logoPublicId && !isBusinessAsset(input.logoPublicId, businessId)) throw new Error("Forbidden");
    if (input.socialQrPublicId && !isBusinessAsset(input.socialQrPublicId, businessId)) throw new Error("Forbidden");
    const now = new Date();
    await businesses.updateOne(
      { _id: businessId },
      { $set: { ...input, updatedAt: now } },
      { upsert: true },
    );
    return apiSuccess(await businesses.findOne({ _id: businessId }));
  } catch (error) {
    return handleApiError(error);
  }
}
