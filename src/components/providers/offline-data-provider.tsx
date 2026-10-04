"use client";

import * as React from "react";
import { cacheBusinessSettings, cacheTemplates, photoboothDb } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import { defaultPalette, templates as defaultTemplates } from "@/config/mock-data";

export function OfflineDataProvider() {
  const updateBranding = useBusinessStore((state) => state.updateBranding);
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
        updateBranding(settings.branding);
        updatePalette(settings.palette);
        setAssetReferences({ logoPublicId: settings.logoPublicId ?? null, socialQrUrl: settings.socialQrUrl ?? null, socialQrPublicId: settings.socialQrPublicId ?? null });
      } else {
        await cacheBusinessSettings(useBusinessStore.getState().branding, defaultPalette);
      }
      if (cachedTemplates.length) setTemplates(cachedTemplates);
      else await cacheTemplates(defaultTemplates);

      if (!navigator.onLine) return;
      try {
        const [businessResponse, templatesResponse] = await Promise.all([fetch("/api/business"), fetch("/api/templates")]);
        if (businessResponse.ok) {
          const { data } = await businessResponse.json() as { data: { branding: ReturnType<typeof useBusinessStore.getState>["branding"]; palette: ReturnType<typeof useBusinessStore.getState>["palette"]; logoPublicId?: string | null; socialQrUrl?: string | null; socialQrPublicId?: string | null } };
          if (!active) return;
          updateBranding(data.branding);
          updatePalette(data.palette);
          const assets = { logoPublicId: data.logoPublicId ?? null, socialQrUrl: data.socialQrUrl ?? null, socialQrPublicId: data.socialQrPublicId ?? null };
          setAssetReferences(assets);
          await cacheBusinessSettings(data.branding, data.palette, assets);
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
      }
    }
    void hydrateLocalData();
    return () => { active = false; };
  }, [setAssetReferences, setTemplates, updateBranding, updatePalette]);

  return null;
}
