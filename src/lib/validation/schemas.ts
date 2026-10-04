import { z } from "zod";

export const paletteSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const brandingSchema = z.object({
  name: z.string().trim().min(1).max(80),
  monogram: z.string().trim().min(1).max(30),
  handle: z.string().trim().max(80),
  headerText: z.string().trim().max(120),
  footerText: z.string().trim().max(120),
  customMessage: z.string().trim().max(500),
  logoDataUrl: z.string().nullable(),
});

export const businessSchema = z.object({
  branding: brandingSchema,
  palette: paletteSchema,
  socialQrUrl: z.url().nullable().optional(),
  socialQrPublicId: z.string().nullable().optional(),
  logoPublicId: z.string().nullable().optional(),
});

export const templateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().trim().min(1).max(80),
  layout: z.enum(["single", "double", "triple", "quad"]),
  photoSlots: z.number().int().min(1).max(4),
  size: z.string().regex(/^\d+\s*[×x]\s*\d+\s*mm$/i),
  isDefault: z.boolean(),
  logoPlacement: z.enum(["top", "bottom"]),
  palette: paletteSchema,
});

const imageDataUrlSchema = z.string().startsWith("data:image/").max(12_000_000);

export const sessionUploadSchema = z.object({
  id: z.uuid(),
  templateId: z.string().min(1).max(80),
  photoCount: z.number().int().min(1).max(4),
  colorImage: imageDataUrlSchema,
  bwImage: imageDataUrlSchema,
});

export const assetUploadSchema = z.object({
  dataUrl: imageDataUrlSchema,
  kind: z.enum(["logo", "social-qr"]),
  previousPublicId: z.string().max(300).nullable().optional(),
});
