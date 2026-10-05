"use client";

import { photoboothDb, type LocalSessionRecord, type SyncQueueRecord } from "@/lib/db/indexed-db";

const MAX_SYNC_ATTEMPTS = 3;
let processing = false;

async function postSession(session: LocalSessionRecord) {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: session.id, templateId: session.templateId, photoCount: session.photoCount, colorImage: session.colorImage, bwImage: session.bwImage }),
  });
  const result = await response.json() as { data?: { shareToken: string; shareUrl: string }; error?: { message?: string } };
  if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Session sync failed.");
  await photoboothDb.sessions.update(session.id, { syncStatus: "synced", shareToken: result.data.shareToken });
  return result.data;
}

async function syncBusiness() {
  const settings = await photoboothDb.businessSettings.get("default");
  if (!settings) return;
  const response = await fetch("/api/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isConfigured: settings.isConfigured, branding: settings.branding, palette: settings.palette, logoPublicId: settings.logoPublicId ?? null, socialUrl: settings.socialUrl ?? null, socialQrUrl: settings.socialQrUrl ?? null, socialQrPublicId: settings.socialQrPublicId ?? null }) });
  if (!response.ok) throw new Error("Business settings sync failed.");
}

async function syncTemplate(templateId: string, operation: SyncQueueRecord["operation"]) {
  if (operation === "delete") {
    const response = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, { method: "DELETE" });
    if (!response.ok && response.status !== 404) throw new Error("Template deletion sync failed.");
    return;
  }
  const template = await photoboothDb.templates.get(templateId);
  if (!template) return;
  let response = await fetch(`/api/templates/${encodeURIComponent(templateId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(template) });
  if (response.status === 404) response = await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(template) });
  if (!response.ok) throw new Error("Template sync failed.");
}

async function processItem(item: SyncQueueRecord) {
  if (item.entityType === "session") {
    if (item.operation === "delete") {
      const response = await fetch(`/api/sessions/${encodeURIComponent(item.entityId)}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) throw new Error("Session deletion sync failed.");
      return;
    }
    const session = await photoboothDb.sessions.get(item.entityId);
    if (session) await postSession(session);
  } else if (item.entityType === "business") await syncBusiness();
  else await syncTemplate(item.entityId, item.operation);
}

export async function processSyncQueue() {
  if (processing || !navigator.onLine) return;
  processing = true;
  try {
    const items = await photoboothDb.syncQueue.where("status").anyOf("pending", "failed").sortBy("createdAt");
    for (const item of items) {
      if (!item.id || item.attempts >= MAX_SYNC_ATTEMPTS) continue;
      await photoboothDb.syncQueue.update(item.id, { status: "processing", updatedAt: Date.now() });
      try {
        await processItem(item);
        await photoboothDb.syncQueue.delete(item.id);
      } catch (error) {
        const attempts = item.attempts + 1;
        await photoboothDb.syncQueue.update(item.id, { attempts, status: attempts >= MAX_SYNC_ATTEMPTS ? "failed" : "pending", lastError: error instanceof Error ? error.message : "Sync failed", updatedAt: Date.now() });
      }
    }
  } finally {
    processing = false;
    window.dispatchEvent(new Event("photobooth-sync-updated"));
  }
}

export async function syncSessionNow(sessionId: string) {
  const session = await photoboothDb.sessions.get(sessionId);
  if (!session || !navigator.onLine) return null;
  const result = await postSession(session);
  await photoboothDb.syncQueue.where({ entityType: "session", entityId: sessionId }).delete();
  window.dispatchEvent(new Event("photobooth-sync-updated"));
  return result;
}

export async function retryFailedSync() {
  const failed = await photoboothDb.syncQueue.where("status").equals("failed").toArray();
  await Promise.all(failed.filter((item) => item.id).map((item) => photoboothDb.syncQueue.update(item.id!, { attempts: 0, status: "pending", lastError: undefined, updatedAt: Date.now() })));
  await processSyncQueue();
}
