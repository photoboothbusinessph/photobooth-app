import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug, templateDocumentId, templatePublicId } from "@/lib/db/tenant";
import { templateSchema } from "@/lib/validation/schemas";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { normalizeReceiptTemplate } from "@/lib/receipt/template-rules";

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    const businessId = slug ? (await getBusinessBySlug(slug))?._id : (await requireBusinessAdmin()).businessId;
    if (!businessId) return apiSuccess([]);
    const { templates } = await getCollections();
    const items = await templates.find({ businessId }).sort({ isDefault: -1, createdAt: 1 }).toArray();
    return apiSuccess(items.map((item) => normalizeReceiptTemplate({ id: templatePublicId(businessId, item._id), name: item.name, layout: item.layout, photoSlots: item.photoSlots, size: item.size, isDefault: item.isDefault, logoPlacement: item.logoPlacement, palette: item.palette, designMode: item.designMode, overlayImageUrl: item.overlayImageUrl, overlayPublicId: item.overlayPublicId })));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const input = normalizeReceiptTemplate(templateSchema.parse(await request.json()));
    if (input.overlayPublicId && !isBusinessAsset(input.overlayPublicId, businessId)) throw new Error("Forbidden");
    if (input.designMode === "image-overlay" && (!input.overlayImageUrl || !input.overlayPublicId)) return Response.json({ error: { message: "Image templates require an uploaded overlay." } }, { status: 400 });
    const { templates } = await getCollections();
    const now = new Date();
    if (input.isDefault) await templates.updateMany({ businessId }, { $set: { isDefault: false, updatedAt: now } });
    const { id, ...template } = input;
    await templates.insertOne({ _id: templateDocumentId(businessId, id), businessId, ...template, createdAt: now, updatedAt: now });
    return apiSuccess(input, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
