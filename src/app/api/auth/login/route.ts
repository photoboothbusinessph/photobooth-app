import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/responses";
import { createAdminSession } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";
import { getServerEnvironment } from "@/lib/server/env";

const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const { admins } = await getCollections();
    let admin = await admins.findOne({ email });
    const environment = getServerEnvironment();

    if (
      !admin &&
      email === environment.ADMIN_EMAIL.toLowerCase() &&
      input.password === environment.ADMIN_PASSWORD
    ) {
      const now = new Date();
      const passwordHash = await hash(input.password, 12);
      await admins.insertOne({
        _id: crypto.randomUUID(),
        email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      });
      admin = await admins.findOne({ email });
    }

    if (!admin || !(await compare(input.password, admin.passwordHash)))
      return apiError("Invalid email or password.", 401);
    await createAdminSession(admin._id, admin.email);
    return apiSuccess({ authenticated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
