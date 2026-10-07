"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { boothSlug } from "@/lib/booth-path";
import { bindCachedBusinessId, cacheBusinessSettings, cacheTemplates, migrateLegacyOfflineData, photoboothDb } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import { templates as defaultTemplates } from "@/config/mock-data";
import type { ReceiptTemplate } from "@/types";

export function OfflineDataProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const warmedSlug = React.useRef<string | null>(null);
  const routeSlug = boothSlug(pathname);
  const adminRoute = pathname === "/admin" || pathname.startsWith("/admin/") && pathname !== "/admin/login" && pathname !== "/admin/change-password";
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const setHydrated = useBusinessStore((state) => state.setHydrated);
  const setConfigured = useBusinessStore((state) => state.setConfigured);
  const updatePalette = useBusinessStore((state) => state.updatePalette);
  const setTemplates = useBusinessStore((state) => state.setTemplates);
  const setAssetReferences = useBusinessStore((state) => state.setAssetReferences);
  const setTenantKey = useBusinessStore((state) => state.setTenantKey);
  const setBusinessId = useBusinessStore((state) => state.setBusinessId);
  const setBusinessSlug = useBusinessStore((state) => state.setBusinessSlug);
  const resetBusiness = useBusinessStore((state) => state.resetBusiness);

  React.useEffect(() => {
    let active = true;
    async function hydrateLocalData() {
      resetBusiness();
      setTenantKey(routeSlug);
      setBusinessSlug(routeSlug);
      if (!routeSlug && !adminRoute) return;
      const [settings, cachedTemplates] = routeSlug ? await Promise.all([
        photoboothDb.businessSettings.get(routeSlug),
        photoboothDb.cachedTemplates.where("tenantKey").equals(routeSlug).toArray(),
      ]).catch(() => [null, []] as [null, ReceiptTemplate[]]) : [null, []];
      if (!active) return;
      if (settings) {
        setBusinessId(settings.identityVerified ? settings.businessId : null);
        setConfigured(Boolean(settings.isConfigured));
        updateBranding(settings.branding);
        updatePalette(settings.palette);
        setAssetReferences({ logoPublicId: settings.logoPublicId ?? null, socialUrl: settings.socialUrl ?? null, socialQrUrl: settings.socialQrUrl ?? null, socialQrPublicId: settings.socialQrPublicId ?? null });
      }
      if (cachedTemplates.length) setTemplates(cachedTemplates);
      else if (routeSlug) setTemplates(defaultTemplates);

      if (!navigator.onLine) {
        setHydrated(true);
        return;
      }
      try {
        const query = routeSlug ? `?slug=${encodeURIComponent(routeSlug)}` : "";
        const [businessResponse, templatesResponse] = await Promise.all([fetch(`/api/business${query}`), fetch(`/api/templates${query}`)]);
        if (businessResponse.ok) {
          const { data } = await businessResponse.json() as { data: { _id: string; slug?: string; isConfigured?: boolean; branding: ReturnType<typeof useBusinessStore.getState>["branding"]; palette: ReturnType<typeof useBusinessStore.getState>["palette"]; logoPublicId?: string | null; socialUrl?: string | null; socialQrUrl?: string | null; socialQrPublicId?: string | null } };
          if (!active) return;
          const tenantKey = routeSlug ?? data._id;
          setTenantKey(tenantKey);
          setBusinessId(data._id);
          setBusinessSlug(data.slug ?? routeSlug);
          setConfigured(Boolean(data.isConfigured));
          updateBranding(data.branding);
          updatePalette(data.palette);
          const assets = { logoPublicId: data.logoPublicId ?? null, socialUrl: data.socialUrl ?? null, socialQrUrl: data.socialQrUrl ?? null, socialQrPublicId: data.socialQrPublicId ?? null };
          setAssetReferences(assets);
          setHydrated(true);
          try {
            if (routeSlug && data._id === "default") await migrateLegacyOfflineData(routeSlug);
            await bindCachedBusinessId(tenantKey, data._id);
            await cacheBusinessSettings(data.branding, data.palette, assets, Boolean(data.isConfigured), tenantKey);
          } catch {
            // Browser storage may be unavailable; a verified server response can still render.
          }
        }
        if (templatesResponse.ok) {
          const { data } = await templatesResponse.json() as { data: ReturnType<typeof useBusinessStore.getState>["templates"] };
          if (data.length && active) {
            setTemplates(data);
            await cacheTemplates(data, routeSlug ?? useBusinessStore.getState().tenantKey).catch(() => undefined);
          }
        }
      } catch {
        // The locally cached configuration remains authoritative while offline.
      } finally {
        if (active) { setHydrated(true); window.dispatchEvent(new Event("photobooth-sync-requested")); }
      }
    }
    void hydrateLocalData();
    return () => { active = false; };
  }, [adminRoute, resetBusiness, routeSlug, setAssetReferences, setBusinessId, setBusinessSlug, setConfigured, setHydrated, setTemplates, setTenantKey, updateBranding, updatePalette]);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !routeSlug || pathname.endsWith("/pair") || warmedSlug.current === routeSlug || !navigator.onLine || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    async function warmTenantRoutes() {
      await navigator.serviceWorker.ready;
      if (cancelled || !navigator.serviceWorker.controller) return;
      const status = await fetch(`/api/kiosks/status?slug=${encodeURIComponent(routeSlug!)}`, { cache: "no-store" });
      if (!status.ok || cancelled) return;
      const base = `/b/${routeSlug}`;
      for (const path of [base, ...["templates", "camera", "preview", "photo-qr", "social"].map((step) => `${base}/booth/${step}`)]) {
        if (cancelled) break;
        router.prefetch(path);
        await fetch(path, { headers: { Accept: "text/html" }, credentials: "same-origin" }).catch(() => undefined);
      }
      if (!cancelled) warmedSlug.current = routeSlug;
    }
    void warmTenantRoutes().catch(() => undefined);
    return () => { cancelled = true; };
  }, [pathname, routeSlug, router]);

  return null;
}
