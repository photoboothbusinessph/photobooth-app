"use client";

import * as React from "react";
import { cacheBusinessSettings, cacheTemplates, photoboothDb } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import { defaultPalette, templates as defaultTemplates } from "@/config/mock-data";

export function OfflineDataProvider() {
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const setHydrated = useBusinessStore((state) => state.setHydrated);
  const setConfigured = useBusinessStore((state) => state.setConfigured);
  const updatePalette = useBusinessStore((state) => state.updatePalette);
  const setTemplates = useBusinessStore((state) => state.setTemplates);
  const setAssetReferences = useBusinessStore((state) => state.setAssetReferences);

  React.useEffect(() => {
    let active = true;
    async function hydrateLocalData() {
      const [settings, cachedTemplates] = await Promise.all([
        photoboothDb.businessSettings.get("default"),
        photoboothDb.templates.toArray(),
      ]);
      if (!active) return;
      if (settings) {
        setConfigured(Boolean(settings.isConfigured));
        updateBranding(settings.branding);
        updatePalette(settings.palette);
        setAssetReferences({ logoPublicId: settings.logoPublicId ?? null, socialUrl: settings.socialUrl ?? null, socialQrUrl: settings.socialQrUrl ?? null, socialQrPublicId: settings.socialQrPublicId ?? null });
      } else {
        await cacheBusinessSettings(useBusinessStore.getState().branding, defaultPalette, {}, false);
      }
      if (cachedTemplates.length) setTemplates(cachedTemplates);
      else await cacheTemplates(defaultTemplates);

      if (!navigator.onLine) {
        setHydrated(true);
        return;
      }
      try {
        const [businessResponse, templatesResponse] = await Promise.all([fetch("/api/business"), fetch("/api/templates")]);
        if (businessResponse.ok) {
          const { data } = await businessResponse.json() as { data: { isConfigured?: boolean; branding: ReturnType<typeof useBusinessStore.getState>["branding"]; palette: ReturnType<typeof useBusinessStore.getState>["palette"]; logoPublicId?: string | null; socialUrl?: string | null; socialQrUrl?: string | null; socialQrPublicId?: string | null } };
          if (!active) return;
          setConfigured(Boolean(data.isConfigured));
          updateBranding(data.branding);
          updatePalette(data.palette);
          const assets = { logoPublicId: data.logoPublicId ?? null, socialUrl: data.socialUrl ?? null, socialQrUrl: data.socialQrUrl ?? null, socialQrPublicId: data.socialQrPublicId ?? null };
          setAssetReferences(assets);
          await cacheBusinessSettings(data.branding, data.palette, assets, Boolean(data.isConfigured));
        }
        if (templatesResponse.ok) {
          const { data } = await templatesResponse.json() as { data: ReturnType<typeof useBusinessStore.getState>["templates"] };
          if (data.length && active) {
            setTemplates(data);
            await cacheTemplates(data);
          }
        }
      } catch {
        // The locally cached configuration remains authoritative while offline.
      } finally {
        if (active) setHydrated(true);
      }
    }
    void hydrateLocalData();
    return () => { active = false; };
  }, [setAssetReferences, setConfigured, setHydrated, setTemplates, updateBranding, updatePalette]);

  return null;
}
