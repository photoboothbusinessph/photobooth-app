import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { templateSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const { templates } = await getCollections();
    const items = await templates.find({ businessId: "default" }).sort({ isDefault: -1, createdAt: 1 }).toArray();
    return apiSuccess(items.map((item) => ({ id: item._id, name: item.name, layout: item.layout, photoSlots: item.photoSlots, size: item.size, isDefault: item.isDefault, logoPlacement: item.logoPlacement, palette: item.palette })));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = templateSchema.parse(await request.json());
    const { templates } = await getCollections();
    const now = new Date();
    if (input.isDefault) await templates.updateMany({ businessId: "default" }, { $set: { isDefault: false, updatedAt: now } });
    const { id, ...template } = input;
    await templates.insertOne({ _id: id, businessId: "default", ...template, createdAt: now, updatedAt: now });
    return apiSuccess(input, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
