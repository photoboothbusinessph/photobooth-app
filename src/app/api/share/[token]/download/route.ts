import { apiError, handleApiError } from "@/lib/api/responses";
import { getCloudinaryImageUrl } from "@/lib/cloudinary/client";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getPublicShareDownloadAsset, publicShareTokenPattern, type PublicShareVariant } from "@/lib/share/public-share-data";

const variants = new Set<PublicShareVariant>(["color", "bw"]);
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function GET(request: Request, context: RouteContext<"/api/share/[token]/download">) {
  try {
    enforceRateLimit(request, "public-share-download", 30, 60_000);
    const { token } = await context.params;
    const variant = new URL(request.url).searchParams.get("variant");
    if (!publicShareTokenPattern.test(token) || !variant || !variants.has(variant as PublicShareVariant))
      return apiError("Invalid download request.", 400);

    const asset = await getPublicShareDownloadAsset(token, variant as PublicShareVariant);
    if (!asset) return apiError("This photo link is unavailable or expired.", 404);

    const imageResponse = await fetch(getCloudinaryImageUrl(asset.publicId), {
      cache: "no-store",
      signal: request.signal,
    });
    const contentType = imageResponse.headers.get("content-type")?.split(";", 1)[0];
    if (!imageResponse.ok || !imageResponse.body || !contentType || !allowedImageTypes.has(contentType))
      return apiError("The receipt image is temporarily unavailable.", 502);

    const filename = `receipt-${variant}.png`;
    return new Response(imageResponse.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
