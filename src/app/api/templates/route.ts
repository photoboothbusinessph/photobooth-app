import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug, templateDocumentId, templatePublicId } from "@/lib/db/tenant";
import { templateSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    const businessId = slug ? (await getBusinessBySlug(slug))?._id : (await requireBusinessAdmin()).businessId;
    if (!businessId) return apiSuccess([]);
    const { templates } = await getCollections();
    const items = await templates.find({ businessId }).sort({ isDefault: -1, createdAt: 1 }).toArray();
    return apiSuccess(items.map((item) => ({ id: templatePublicId(businessId, item._id), name: item.name, layout: item.layout, photoSlots: item.photoSlots, size: item.size, isDefault: item.isDefault, logoPlacement: item.logoPlacement, palette: item.palette })));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const input = templateSchema.parse(await request.json());
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
