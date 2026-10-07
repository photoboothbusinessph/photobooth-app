import { apiSuccess, handleApiError } from "@/lib/api/responses";
import { requireKiosk } from "@/lib/auth/kiosk";

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    const kiosk = await requireKiosk(slug);
    return apiSuccess({ paired: true, deviceId: kiosk.deviceId });
  } catch (error) { return handleApiError(error); }
}
