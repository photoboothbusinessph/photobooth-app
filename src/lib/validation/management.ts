import { z } from "zod";

export const slugSchema = z.string().trim().toLowerCase().min(2).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const createBusinessSchema = z.object({ name: z.string().trim().min(2).max(80), slug: slugSchema });
export const createAdminSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), businessId: z.union([z.literal("default"), z.uuid()]) });
export const deviceNameSchema = z.object({ name: z.string().trim().min(2).max(80) });
