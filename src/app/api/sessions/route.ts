import { randomBytes } from "node:crypto";
import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { requireKiosk } from "@/lib/auth/kiosk";
import { deleteImage, getCloudinaryImageUrl, uploadImage } from "@/lib/cloudinary/client";
import { getCollections } from "@/lib/db/collections";
import { sessionUploadSchema } from "@/lib/validation/schemas";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { templates as starterTemplates } from "@/config/mock-data";
import { templateSupportsPhotoSlots } from "@/lib/receipt/template-rules";

export async function GET() {
  try {
    const { businessId } = await requireBusinessAdmin();
    const { sessions } = await getCollections();
    return apiSuccess(
      await sessions.find({ businessId }).sort({ createdAt: -1 }).limit(100).toArray(),
    );
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
    if (existing) return apiSuccess(toShareResult(existing.shareToken, request.url));
    const template = await templates.findOne({
      _id: businessId === "default" ? input.templateId : `${businessId}__${input.templateId}`,
      businessId,
    });
    const resolvedTemplate =
      template ?? starterTemplates.find((item) => item.builtIn && item.id === input.templateId);
    if (
      !resolvedTemplate ||
      !templateSupportsPhotoSlots({ ...resolvedTemplate, id: input.templateId }, input.photoCount)
    )
      throw new Error("Forbidden");

    let color: { url: string; publicId: string };
    let bw: { url: string; publicId: string };
    if ("colorPublicId" in input) {
      const assetFolder = `receipt-photobooth/${businessId}/sessions/${input.id}`;
      const expectedColorPublicId = `${assetFolder}/color`;
      const expectedBwPublicId = `${assetFolder}/black-and-white`;
      if (input.colorPublicId !== expectedColorPublicId || input.bwPublicId !== expectedBwPublicId)
        throw new Error("Forbidden");
      colorPublicId = input.colorPublicId;
      bwPublicId = input.bwPublicId;
      color = { publicId: colorPublicId, url: getCloudinaryImageUrl(colorPublicId) };
      bw = { publicId: bwPublicId, url: getCloudinaryImageUrl(bwPublicId) };
    } else {
      color = await uploadImage(
        input.colorImage,
        `${businessId}/sessions/${input.id}`,
        "color",
      );
      colorPublicId = color.publicId;
      bw = await uploadImage(
        input.bwImage,
        `${businessId}/sessions/${input.id}`,
        "black-and-white",
      );
      bwPublicId = bw.publicId;
    }
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
    return apiSuccess(toShareResult(shareToken, request.url), { status: 201 });
  } catch (error) {
    if (colorPublicId) await deleteImage(colorPublicId).catch(() => undefined);
    if (bwPublicId) await deleteImage(bwPublicId).catch(() => undefined);
    return handleApiError(error);
  }
}

function toShareResult(shareToken: string, requestUrl: string) {
  return { shareToken, shareUrl: new URL(`/share/${shareToken}`, requestUrl).toString() };
}
