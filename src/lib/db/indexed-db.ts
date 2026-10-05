import Dexie, { type EntityTable } from "dexie";
import type { BusinessBranding, CapturedPhoto, ReceiptTemplate, SyncStatus, ThemePalette } from "@/types";

export interface LocalBusinessSettings {
  id: "default";
  isConfigured: boolean;
  branding: BusinessBranding;
  palette: ThemePalette;
  logoPublicId?: string | null;
  socialUrl?: string | null;
  socialQrUrl?: string | null;
  socialQrPublicId?: string | null;
  updatedAt: number;
}

export interface LocalSessionRecord {
  id: string;
  templateId: string;
  photoCount: number;
  colorImage: string;
  bwImage: string;
  createdAt: number;
  syncStatus: SyncStatus;
  shareToken?: string;
  cloudColorUrl?: string;
  cloudBwUrl?: string;
}

export interface LocalPhotoRecord extends CapturedPhoto {
  sessionId: string;
  order: number;
  syncStatus: SyncStatus;
}

export interface SyncQueueRecord {
  id?: number;
  entityType: "business" | "template" | "session";
  entityId: string;
  operation: "upsert" | "delete";
  attempts: number;
  status: "pending" | "processing" | "failed";
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

class PhotoboothDatabase extends Dexie {
  businessSettings!: EntityTable<LocalBusinessSettings, "id">;
  templates!: EntityTable<ReceiptTemplate, "id">;
  sessions!: EntityTable<LocalSessionRecord, "id">;
  photos!: EntityTable<LocalPhotoRecord, "id">;
  syncQueue!: EntityTable<SyncQueueRecord, "id">;

  constructor() {
    super("receipt-photobooth");
    this.version(1).stores({
      businessSettings: "id, updatedAt",
      templates: "id, isDefault",
      sessions: "id, templateId, createdAt, syncStatus",
      photos: "id, sessionId, order, syncStatus",
      syncQueue: "++id, entityType, entityId, status, createdAt",
    });
  }
}

export const photoboothDb = new PhotoboothDatabase();

export async function cacheBusinessSettings(
  branding: BusinessBranding,
  palette: ThemePalette,
  assets: Pick<LocalBusinessSettings, "logoPublicId" | "socialUrl" | "socialQrUrl" | "socialQrPublicId"> = {},
  isConfigured = false,
) {
  await photoboothDb.businessSettings.put({ id: "default", isConfigured, branding, palette, ...assets, updatedAt: Date.now() });
}

export async function cacheTemplates(templates: ReceiptTemplate[]) {
  await photoboothDb.transaction("rw", photoboothDb.templates, async () => {
    await photoboothDb.templates.clear();
    await photoboothDb.templates.bulkPut(templates);
  });
}

export async function saveLocalSession({ id, templateId, photos, colorImage, bwImage, syncStatus = "local" }: { id: string; templateId: string; photos: CapturedPhoto[]; colorImage: string; bwImage: string; syncStatus?: SyncStatus }) {
  const now = Date.now();
  await photoboothDb.transaction("rw", photoboothDb.sessions, photoboothDb.photos, photoboothDb.syncQueue, async () => {
    await photoboothDb.sessions.put({ id, templateId, photoCount: photos.length, colorImage, bwImage, createdAt: now, syncStatus });
    await photoboothDb.photos.bulkPut(photos.map((photo, order) => ({ ...photo, sessionId: id, order, syncStatus })));
    await photoboothDb.syncQueue.add({ entityType: "session", entityId: id, operation: "upsert", attempts: 0, status: "pending", createdAt: now, updatedAt: now });
  });
}

export async function queueSync(entityType: SyncQueueRecord["entityType"], entityId: string, operation: SyncQueueRecord["operation"] = "upsert") {
  const existing = await photoboothDb.syncQueue.where({ entityType, entityId, status: "pending" }).first();
  if (existing?.id) {
    if (existing.operation !== operation) await photoboothDb.syncQueue.update(existing.id, { operation, updatedAt: Date.now() });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("photobooth-sync-requested"));
    return existing.id;
  }
  const now = Date.now();
  const id = await photoboothDb.syncQueue.add({ entityType, entityId, operation, attempts: 0, status: "pending", createdAt: now, updatedAt: now });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("photobooth-sync-requested"));
  return id;
}

export async function resetLocalData() {
  await photoboothDb.transaction("rw", photoboothDb.tables, async () => {
    await Promise.all(photoboothDb.tables.map((table) => table.clear()));
  });
}
