import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";

export async function GET() {
  try {
    await requireSuperAdmin();
    const { kioskDevices } = await getCollections();
    return apiSuccess(await kioskDevices.find({}, { projection: { tokenHash: 0 } }).sort({ pairedAt: -1 }).toArray());
  } catch (error) { return handleApiError(error); }
}
