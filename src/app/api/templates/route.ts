import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug, templateDocumentId, templatePublicId } from "@/lib/db/tenant";
import { templateSchema } from "@/lib/validation/schemas";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { normalizeReceiptTemplate, overlaySlotRectsAreValid } from "@/lib/receipt/template-rules";
import { ensureStarterTemplateCatalog } from "@/lib/receipt/starter-template-catalog";

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    const businessId = slug ? (await getBusinessBySlug(slug))?._id : (await requireBusinessAdmin()).businessId;
    if (!businessId) return apiSuccess([]);
    await ensureStarterTemplateCatalog(businessId);
    const { templates } = await getCollections();
    const items = await templates.find({ businessId }).sort({ isDefault: -1, createdAt: 1 }).toArray();
    const stored = items.map((item) => normalizeReceiptTemplate({ id: templatePublicId(businessId, item._id), name: item.name, layout: item.layout, photoSlots: item.photoSlots, supportedPhotoSlots: item.supportedPhotoSlots, size: item.size, isDefault: item.isDefault, logoPlacement: item.logoPlacement, palette: item.palette, designMode: item.designMode, designStyle: item.designStyle, builtIn: item.builtIn, overlayImageUrl: item.overlayImageUrl, overlayPublicId: item.overlayPublicId, overlaySlotRects: item.overlaySlotRects }));
    return apiSuccess(stored);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const input = normalizeReceiptTemplate({ ...templateSchema.parse(await request.json()), builtIn: false });
    if (!overlaySlotRectsAreValid(input)) return Response.json({ error: { message: "Photo windows must stay inside the receipt and match the selected photo count." } }, { status: 400 });
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
