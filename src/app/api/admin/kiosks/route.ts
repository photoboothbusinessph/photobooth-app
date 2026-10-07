import { randomBytes, randomUUID } from "node:crypto";
import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { hashKioskSecret } from "@/lib/auth/kiosk";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { deviceNameSchema } from "@/lib/validation/management";

export async function GET() {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { kioskDevices } = await getCollections();
    return apiSuccess(await kioskDevices.find({ businessId }, { projection: { tokenHash: 0 } }).sort({ pairedAt: -1 }).toArray());
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { name } = deviceNameSchema.parse(await request.json());
    const code = randomBytes(8).toString("hex").toUpperCase();
    const { pairCodes } = await getCollections();
    await pairCodes.insertOne({ _id: randomUUID(), businessId, codeHash: hashKioskSecret(code), name, expiresAt: new Date(Date.now() + 10 * 60_000), usedAt: null });
    return apiSuccess({ code, expiresInSeconds: 600 }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
