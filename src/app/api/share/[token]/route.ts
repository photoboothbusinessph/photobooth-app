import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { getPublicShareData, publicShareTokenPattern } from "@/lib/share/public-share-data";

export async function GET(request: Request, context: RouteContext<"/api/share/[token]">) {
  try {
    enforceRateLimit(request, "public-share", 120, 60_000);
    const { token } = await context.params;
    if (!publicShareTokenPattern.test(token)) return apiError("Invalid share link.", 400);
    const data = await getPublicShareData(token);
    if (!data) return apiError("This photo link is unavailable or expired.", 404);
    return apiSuccess({
      sessionId: data.sessionId,
      colorImageUrl: data.colorImageUrl,
      bwImageUrl: data.bwImageUrl,
      createdAt: data.createdAt,
      business: { branding: data.branding, socialUrl: data.socialUrl, socialQrUrl: data.socialQrUrl },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
