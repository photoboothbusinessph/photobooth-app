import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireKiosk } from "@/lib/auth/kiosk";
import { createSignedSessionUpload } from "@/lib/cloudinary/client";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sessionUploadSignatureSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "session-upload-signature", 60, 60_000);
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    const { businessId } = await requireKiosk(slug);
    const input = sessionUploadSignatureSchema.parse(await request.json());
    return apiSuccess(createSignedSessionUpload(businessId, input.id, input.variant));
  } catch (error) {
    return handleApiError(error);
  }
}
