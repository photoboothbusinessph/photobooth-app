import { randomUUID } from "node:crypto";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { business, defaultPalette, templates as starterTemplates } from "@/config/mock-data";
import { getCollections } from "@/lib/db/collections";
import { getMongoClient } from "@/lib/db/mongodb";
import { templateDocumentId } from "@/lib/db/tenant";
import { createBusinessSchema } from "@/lib/validation/management";

export async function GET() {
  try {
    await requireSuperAdmin();
    const { businesses, admins, kioskDevices } = await getCollections();
    const items = await businesses.find({}, { projection: { _id: 1, slug: 1, "branding.name": 1, isConfigured: 1 } }).sort({ slug: 1 }).toArray();
    const counts = await Promise.all(items.map(async (item) => ({ ...item, adminCount: await admins.countDocuments({ businessId: item._id, isEnabled: { $ne: false } }), kioskCount: await kioskDevices.countDocuments({ businessId: item._id, isEnabled: true }) })));
    return apiSuccess(counts);
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const input = createBusinessSchema.parse(await request.json());
    const { businesses, templates } = await getCollections();
    if (await businesses.findOne({ slug: input.slug })) return apiError("Business URL is already in use.", 409);
    const id = randomUUID();
    const now = new Date();
    const session = (await getMongoClient()).startSession();
    try {
      await session.withTransaction(async () => {
        await businesses.insertOne({ _id: id, slug: input.slug, isConfigured: false, branding: { ...business, name: input.name, monogram: input.name.slice(0, 2).toUpperCase(), logoDataUrl: null }, palette: defaultPalette, socialUrl: null, socialQrUrl: null, socialQrPublicId: null, logoPublicId: null, updatedAt: now }, { session });
        await templates.insertMany(starterTemplates.map(({ id: templateId, ...template }) => ({ ...template, _id: templateDocumentId(id, templateId), businessId: id, createdAt: now, updatedAt: now })), { session });
      });
    } finally { await session.endSession(); }
    return apiSuccess({ id, slug: input.slug, name: input.name }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
