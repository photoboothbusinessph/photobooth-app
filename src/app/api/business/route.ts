import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { businessSchema } from "@/lib/validation/schemas";
import { business, defaultPalette } from "@/config/mock-data";

export async function GET() {
  try {
    const { businesses } = await getCollections();
    const document = await businesses.findOne({ _id: "default" });
    return apiSuccess(
      document ?? {
        _id: "default",
        isConfigured: false,
        branding: { ...business, logoDataUrl: null },
        palette: defaultPalette,
        socialUrl: null,
        socialQrUrl: null,
        socialQrPublicId: null,
        logoPublicId: null,
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const input = businessSchema.parse(await request.json());
    const { businesses } = await getCollections();
    const now = new Date();
    await businesses.updateOne(
      { _id: "default" },
      { $set: { ...input, updatedAt: now } },
      { upsert: true },
    );
    return apiSuccess(await businesses.findOne({ _id: "default" }));
  } catch (error) {
    return handleApiError(error);
  }
}
