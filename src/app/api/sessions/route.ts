import { randomBytes } from "node:crypto";
import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { requireKiosk } from "@/lib/auth/kiosk";
import { deleteImage, uploadImage } from "@/lib/cloudinary/client";
import { getCollections } from "@/lib/db/collections";
import { getApplicationEnvironment } from "@/lib/server/env";
import { sessionUploadSchema } from "@/lib/validation/schemas";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function GET() {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { sessions } = await getCollections();
    return apiSuccess(await sessions.find({ businessId }).sort({ createdAt: -1 }).limit(100).toArray());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  let colorPublicId: string | null = null;
  let bwPublicId: string | null = null;
  try {
    enforceRateLimit(request, "session-upload", 30, 60_000);
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    const { businessId } = await requireKiosk(slug);
    const input = sessionUploadSchema.parse(await request.json());
    const { sessions, templates } = await getCollections();
    const existing = await sessions.findOne({ _id: input.id });
    if (existing && existing.businessId !== businessId) throw new Error("Forbidden");
    if (existing) return apiSuccess(toShareResult(existing.shareToken));
    const template = await templates.findOne({ _id: businessId === "default" ? input.templateId : `${businessId}__${input.templateId}`, businessId });
    if (!template || template.photoSlots !== input.photoCount) throw new Error("Forbidden");

    const color = await uploadImage(input.colorImage, `${businessId}/sessions/${input.id}`, "color");
    colorPublicId = color.publicId;
    const bw = await uploadImage(input.bwImage, `${businessId}/sessions/${input.id}`, "black-and-white");
    bwPublicId = bw.publicId;
    const shareToken = randomBytes(24).toString("base64url");
    const now = new Date();
    await sessions.insertOne({
      _id: input.id,
      businessId,
      templateId: input.templateId,
      photoCount: input.photoCount,
      shareToken,
      colorImageUrl: color.url,
      colorPublicId: color.publicId,
      bwImageUrl: bw.url,
      bwPublicId: bw.publicId,
      syncStatus: "synced",
      createdAt: now,
      updatedAt: now,
    });
    return apiSuccess(toShareResult(shareToken), { status: 201 });
  } catch (error) {
    if (colorPublicId) await deleteImage(colorPublicId).catch(() => undefined);
    if (bwPublicId) await deleteImage(bwPublicId).catch(() => undefined);
    return handleApiError(error);
  }
}

function toShareResult(shareToken: string) {
  const baseUrl = getApplicationEnvironment().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return { shareToken, shareUrl: `${baseUrl}/share/${shareToken}` };
}
