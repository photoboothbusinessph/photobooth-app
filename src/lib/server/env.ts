import "server-only";
import { z } from "zod";

const serverEnvironmentSchema = z.object({
  MONGODB_URI: z.string().min(1),
  MONGODB_DB: z.string().min(1).default("dev"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  SUPER_ADMIN_EMAIL: z.email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().min(12).optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
}).refine((environment) => Boolean(environment.SUPER_ADMIN_EMAIL) === Boolean(environment.SUPER_ADMIN_PASSWORD), "Set both super-admin bootstrap variables or neither.");

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getServerEnvironment(): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(process.env);
  if (!result.success) throw new Error("Server environment is not configured.");
  return result.data;
}
