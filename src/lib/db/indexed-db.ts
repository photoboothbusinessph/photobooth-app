import Dexie, { type EntityTable } from "dexie";
import type { BusinessBranding, CapturedPhoto, ReceiptTemplate, SyncStatus, ThemePalette } from "@/types";
import { boothSlug } from "@/lib/booth-path";
import { useBusinessStore } from "@/stores/business-store";

export function activeTenantKey() {
  if (typeof window === "undefined") return null;
  return boothSlug(window.location.pathname) ?? useBusinessStore.getState().tenantKey;
}
export function activeBusinessId() { return useBusinessStore.getState().businessId; }

export interface LocalTemplateRecord extends ReceiptTemplate { cacheKey: string; tenantKey: string; businessId: string }

export interface LocalBusinessSettings {
  id: string;
  businessId: string;
  identityVerified?: boolean;
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
  businessId: string;
  businessSlug: string;
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
  businessId: string;
  sessionId: string;
  order: number;
  syncStatus: SyncStatus;
}

export interface SyncQueueRecord {
  id?: number;
  businessId: string;
  tenantKey: string;
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
  cachedTemplates!: EntityTable<LocalTemplateRecord, "cacheKey">;
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
    // The former v2/v3 definitions changed the templates primary key in place.
    // Skip those definitions and copy every legacy version into a new store instead.
    this.version(4).stores({
      businessSettings: "id, businessId, updatedAt",
      templates: null,
      cachedTemplates: "cacheKey, tenantKey, businessId, id, isDefault",
      sessions: "id, businessId, businessSlug, templateId, createdAt, syncStatus",
      photos: "id, businessId, sessionId, order, syncStatus",
      syncQueue: "++id, tenantKey, businessId, entityType, entityId, status, createdAt",
    }).upgrade(async (transaction) => {
      const legacyTemplates = await transaction.table("templates").toArray() as Array<ReceiptTemplate & Partial<LocalTemplateRecord>>;
      if (legacyTemplates.length) await transaction.table("cachedTemplates").bulkPut(legacyTemplates.map((template) => {
        const businessId = template.businessId ?? "default";
        const tenantKey = template.tenantKey ?? businessId;
        return { ...template, businessId, tenantKey, cacheKey: `${tenantKey}:${template.id}` };
      }));
      await transaction.table("businessSettings").toCollection().modify((item) => {
        item.businessId ??= "default";
        item.identityVerified ??= item.businessId === "default";
      });
      await transaction.table("sessions").toCollection().modify((item) => {
        item.businessId ??= "default";
        item.businessSlug ??= item.businessId === "default" ? "" : item.businessId;
      });
      await transaction.table("photos").toCollection().modify((item) => { item.businessId ??= "default"; });
      await transaction.table("syncQueue").toCollection().modify((item) => {
        item.businessId ??= "default";
        item.tenantKey ??= item.businessId;
      });
    });
  }
}

export const photoboothDb = new PhotoboothDatabase();

export async function migrateLegacyOfflineData(slug: string) {
  if (slug === "default") return;
  const legacySettings = await photoboothDb.businessSettings.get("default");
  await photoboothDb.transaction("rw", photoboothDb.tables, async () => {
    if (legacySettings) {
      await photoboothDb.businessSettings.put({ ...legacySettings, id: slug, businessId: "default", identityVerified: true });
      await photoboothDb.businessSettings.delete("default");
    }
    const templates = await photoboothDb.cachedTemplates.where("tenantKey").equals("default").toArray();
    for (const template of templates) {
      await photoboothDb.cachedTemplates.put({ ...template, cacheKey: `${slug}:${template.id}`, tenantKey: slug });
      await photoboothDb.cachedTemplates.delete(template.cacheKey);
    }
    await photoboothDb.sessions.where("businessId").equals("default").modify({ businessSlug: slug });
    await photoboothDb.syncQueue.where("tenantKey").equals("default").modify({ tenantKey: slug });
  });
}

export async function bindCachedBusinessId(tenantKey: string, businessId: string) {
  await photoboothDb.transaction("rw", photoboothDb.tables, async () => {
    await photoboothDb.businessSettings.where("id").equals(tenantKey).modify({ businessId, identityVerified: true });
    await photoboothDb.cachedTemplates.where("tenantKey").equals(tenantKey).modify({ businessId });
    await photoboothDb.sessions.where("businessSlug").equals(tenantKey).modify({ businessId });
    await photoboothDb.syncQueue.where("tenantKey").equals(tenantKey).modify({ businessId });
    const sessions = await photoboothDb.sessions.where("businessSlug").equals(tenantKey).primaryKeys();
    for (const id of sessions) await photoboothDb.photos.where("sessionId").equals(id).modify({ businessId });
  });
}

export async function cacheBusinessSettings(
  branding: BusinessBranding,
  palette: ThemePalette,
  assets: Pick<LocalBusinessSettings, "logoPublicId" | "socialUrl" | "socialQrUrl" | "socialQrPublicId"> = {},
  isConfigured = false,
  tenantKey = activeTenantKey(),
) {
  if (!tenantKey) throw new Error("Business context unavailable.");
  const businessId = activeBusinessId();
  if (!businessId) throw new Error("Business identity unavailable.");
  await photoboothDb.businessSettings.put({ id: tenantKey, businessId, identityVerified: true, isConfigured, branding, palette, ...assets, updatedAt: Date.now() });
}

export async function cacheTemplates(templates: ReceiptTemplate[], tenantKey = activeTenantKey()) {
  if (!tenantKey) throw new Error("Business context unavailable.");
  const businessId = activeBusinessId();
  if (!businessId) throw new Error("Business identity unavailable.");
  await photoboothDb.transaction("rw", photoboothDb.cachedTemplates, async () => {
    await photoboothDb.cachedTemplates.where("tenantKey").equals(tenantKey).delete();
    await photoboothDb.cachedTemplates.bulkPut(templates.map((template) => ({ ...template, tenantKey, businessId, cacheKey: `${tenantKey}:${template.id}` })));
  });
}

export async function saveLocalSession({ id, businessId, businessSlug, templateId, photos, colorImage, bwImage, syncStatus = "local" }: { id: string; businessId: string; businessSlug: string; templateId: string; photos: CapturedPhoto[]; colorImage: string; bwImage: string; syncStatus?: SyncStatus }) {
  const now = Date.now();
  await photoboothDb.transaction("rw", photoboothDb.sessions, photoboothDb.photos, photoboothDb.syncQueue, async () => {
    await photoboothDb.sessions.put({ id, businessId, businessSlug, templateId, photoCount: photos.length, colorImage, bwImage, createdAt: now, syncStatus });
    await photoboothDb.photos.bulkPut(photos.map((photo, order) => ({ ...photo, businessId, sessionId: id, order, syncStatus })));
    await photoboothDb.syncQueue.add({ businessId, tenantKey: businessSlug, entityType: "session", entityId: id, operation: "upsert", attempts: 0, status: "pending", createdAt: now, updatedAt: now });
  });
}

export async function queueSync(entityType: SyncQueueRecord["entityType"], entityId: string, operation: SyncQueueRecord["operation"] = "upsert") {
  const tenantKey = activeTenantKey();
  const businessId = activeBusinessId();
  if (!tenantKey || !businessId) throw new Error("Business context unavailable.");
  const existing = await photoboothDb.syncQueue.where({ tenantKey, businessId, entityType, entityId, status: "pending" }).first();
  if (existing?.id) {
    if (existing.operation !== operation) await photoboothDb.syncQueue.update(existing.id, { operation, updatedAt: Date.now() });
    if (typeof window !== "undefined") window.dispatchEvent(new Event("photobooth-sync-requested"));
    return existing.id;
  }
  const now = Date.now();
  const id = await photoboothDb.syncQueue.add({ tenantKey, businessId, entityType, entityId, operation, attempts: 0, status: "pending", createdAt: now, updatedAt: now });
  if (typeof window !== "undefined") window.dispatchEvent(new Event("photobooth-sync-requested"));
  return id;
}

export async function resetLocalData() {
  const businessId = activeBusinessId();
  if (!businessId) throw new Error("Business context unavailable.");
  await photoboothDb.transaction("rw", photoboothDb.tables, async () => {
    await Promise.all([
      photoboothDb.businessSettings.where("businessId").equals(businessId).delete(),
      photoboothDb.cachedTemplates.where("businessId").equals(businessId).delete(),
      photoboothDb.sessions.where("businessId").equals(businessId).delete(),
      photoboothDb.photos.where("businessId").equals(businessId).delete(),
      photoboothDb.syncQueue.where("businessId").equals(businessId).delete(),
    ]);
  });
}
