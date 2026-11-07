import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { createSignedWelcomeVideoUpload } from "@/lib/cloudinary/client";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { welcomeVideoUploadSignatureSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    enforceRateLimit(request, "welcome-video-upload-signature", 10, 60_000);
    const { businessId } = await requireBusinessAdmin();
    welcomeVideoUploadSignatureSchema.parse(await request.json());
    return apiSuccess(createSignedWelcomeVideoUpload(businessId));
  } catch (error) {
    return handleApiError(error);
  }
}
