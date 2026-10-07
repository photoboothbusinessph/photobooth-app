import "server-only";
import type { Collection } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { BusinessBranding, ReceiptTemplate, ThemePalette } from "@/types";

export interface BusinessDocument {
  _id: string;
  slug?: string;
  isConfigured: boolean;
  branding: BusinessBranding;
  palette: ThemePalette;
  socialUrl?: string | null;
  socialQrUrl: string | null;
  socialQrPublicId: string | null;
  logoPublicId: string | null;
  updatedAt: Date;
}

export interface TemplateDocument extends Omit<ReceiptTemplate, "id"> {
  _id: string;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  _id: string;
  businessId: string;
  templateId: string;
  photoCount: number;
  shareToken: string;
  colorImageUrl: string;
  colorPublicId: string;
  bwImageUrl: string;
  bwPublicId: string;
  syncStatus: "synced";
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminDocument {
  _id: string;
  email: string;
  passwordHash: string;
  role?: "super_admin" | "business_admin";
  businessId?: string | null;
  isEnabled?: boolean;
  mustChangePassword?: boolean;
  sessionVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KioskDeviceDocument {
  _id: string;
  businessId: string;
  name: string;
  tokenHash: string;
  isEnabled: boolean;
  pairedAt: Date;
  lastSeenAt: Date | null;
}

export interface PairCodeDocument {
  _id: string;
  businessId: string;
  name: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

let indexesReady: Promise<void> | null = null;

export async function getCollections() {
  const database = await getDatabase();
  const collections = {
    businesses: database.collection<BusinessDocument>("businesses"),
    templates: database.collection<TemplateDocument>("templates"),
    sessions: database.collection<SessionDocument>("sessions"),
    admins: database.collection<AdminDocument>("admins"),
    kioskDevices: database.collection<KioskDeviceDocument>("kioskDevices"),
    pairCodes: database.collection<PairCodeDocument>("pairCodes"),
  };
  indexesReady ??= createIndexes(collections);
  await indexesReady;
  return collections;
}

async function createIndexes(collections: {
  businesses: Collection<BusinessDocument>;
  templates: Collection<TemplateDocument>;
  sessions: Collection<SessionDocument>;
  admins: Collection<AdminDocument>;
  kioskDevices: Collection<KioskDeviceDocument>;
  pairCodes: Collection<PairCodeDocument>;
}) {
  await Promise.all([
    collections.templates.createIndex({ businessId: 1, isDefault: 1 }),
    collections.sessions.createIndex({ shareToken: 1 }, { unique: true }),
    collections.sessions.createIndex({ businessId: 1, createdAt: -1 }),
    collections.admins.createIndex({ email: 1 }, { unique: true }),
    collections.businesses.createIndex({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string" } } }),
    collections.kioskDevices.createIndex({ businessId: 1, isEnabled: 1 }),
    collections.kioskDevices.createIndex({ tokenHash: 1 }, { unique: true }),
    collections.pairCodes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.pairCodes.createIndex({ businessId: 1, codeHash: 1 }, { unique: true }),
  ]);
}
