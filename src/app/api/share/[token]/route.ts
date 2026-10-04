import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { getCollections } from "@/lib/db/collections";

export async function GET(_request: Request, context: RouteContext<"/api/share/[token]">) {
  try {
    const { token } = await context.params;
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return apiError("Invalid share link.", 400);
    const { sessions, businesses } = await getCollections();
    const session = await sessions.findOne({ shareToken: token, businessId: "default" });
    if (!session) return apiError("This photo link is unavailable or expired.", 404);
    const business = await businesses.findOne({ _id: "default" });
    return apiSuccess({
      sessionId: session._id,
      colorImageUrl: session.colorImageUrl,
      bwImageUrl: session.bwImageUrl,
      createdAt: session.createdAt,
      business: business ? { branding: business.branding, socialQrUrl: business.socialQrUrl } : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
