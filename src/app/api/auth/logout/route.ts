import { apiSuccess } from "@/lib/api/responses";
import { deleteAdminSession } from "@/lib/auth/session";

export async function POST() {
  await deleteAdminSession();
  return apiSuccess({ authenticated: false });
}
