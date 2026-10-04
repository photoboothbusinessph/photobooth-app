import "server-only";
import type { Collection } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import type { BusinessBranding, ReceiptTemplate, ThemePalette } from "@/types";

export interface BusinessDocument {
  _id: "default";
  branding: BusinessBranding;
  palette: ThemePalette;
  socialQrUrl: string | null;
  socialQrPublicId: string | null;
  logoPublicId: string | null;
  updatedAt: Date;
}

export interface TemplateDocument extends Omit<ReceiptTemplate, "id"> {
  _id: string;
  businessId: "default";
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionDocument {
  _id: string;
  businessId: "default";
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
  createdAt: Date;
  updatedAt: Date;
}

let indexesReady: Promise<void> | null = null;

export async function getCollections() {
  const database = await getDatabase();
  const collections = {
    businesses: database.collection<BusinessDocument>("businesses"),
    templates: database.collection<TemplateDocument>("templates"),
    sessions: database.collection<SessionDocument>("sessions"),
    admins: database.collection<AdminDocument>("admins"),
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
}) {
  await Promise.all([
    collections.templates.createIndex({ businessId: 1, isDefault: 1 }),
    collections.sessions.createIndex({ shareToken: 1 }, { unique: true }),
    collections.sessions.createIndex({ businessId: 1, createdAt: -1 }),
    collections.admins.createIndex({ email: 1 }, { unique: true }),
  ]);
}
