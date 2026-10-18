import { z } from "zod";

export const slugSchema = z.string().trim().toLowerCase().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const createBusinessSchema = z.object({ name: z.string().trim().min(2).max(80), slug: slugSchema });
export const usernameSchema = z.string().trim().min(3).max(40).regex(
  /^[a-zA-Z0-9._-]+$/,
  "Username may contain only letters, numbers, periods, underscores, and hyphens.",
).transform((value) => value.toLowerCase());
export const createAdminSchema = z.object({ username: usernameSchema, businessId: z.union([z.literal("default"), z.uuid()]) });
export const deviceNameSchema = z.object({ name: z.string().trim().min(2).max(80) });
