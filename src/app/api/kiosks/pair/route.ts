import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { hashKioskSecret, newKioskSecret, setKioskCookie } from "@/lib/auth/kiosk";
import { getCollections } from "@/lib/db/collections";
import { getBusinessBySlug } from "@/lib/db/tenant";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const inputSchema = z.object({ slug: z.string(), code: z.string().regex(/^[0-9A-Fa-f]{16}$/) });

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "kiosk-pair", 5, 60_000);
    const { slug, code } = inputSchema.parse(await request.json());
    const business = await getBusinessBySlug(slug);
    if (!business) return apiError("Invalid pairing code.", 400);
    const { pairCodes, kioskDevices } = await getCollections();
    const matched = await pairCodes.findOneAndUpdate({ businessId: business._id, codeHash: hashKioskSecret(code.toUpperCase()), usedAt: null, expiresAt: { $gt: new Date() } }, { $set: { usedAt: new Date() } }, { returnDocument: "before" });
    if (!matched) return apiError("Invalid or expired pairing code.", 400);
    const token = newKioskSecret();
    await kioskDevices.insertOne({ _id: crypto.randomUUID(), businessId: business._id, name: matched.name, tokenHash: hashKioskSecret(token), isEnabled: true, pairedAt: new Date(), lastSeenAt: new Date() });
    await setKioskCookie(token);
    return apiSuccess({ paired: true });
  } catch (error) { return handleApiError(error); }
}
