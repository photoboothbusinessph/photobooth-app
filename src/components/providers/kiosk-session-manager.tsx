"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { toast } from "sonner";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";

const INACTIVITY_LIMIT_MS = 60_000;
const timedRoutes = new Set(["/booth/templates", "/booth/camera", "/booth/preview"]);

export function KioskSessionManager() {
  const pathname = usePathname();
  const router = useBoothRouter();
  const resetSession = useBoothStore((state) => state.resetSession);
  const hydrateSession = useBoothStore((state) => state.hydrateSession);
  const sessionId = useBoothStore((state) => state.sessionId);
  const persistenceError = useBoothStore((state) => state.persistenceError);
  const capturedPhotoCount = useBoothStore((state) => state.capturedPhotos.length);
  const base = boothBasePath(pathname);
  const active = timedRoutes.has(pathname.slice(base.length));
  const routeTenantKey = boothSlug(pathname) ?? (pathname === "/" || pathname.startsWith("/booth/") ? "legacy" : null);

  React.useEffect(() => {
    if (routeTenantKey) void hydrateSession(routeTenantKey);
  }, [hydrateSession, routeTenantKey]);

  React.useEffect(() => {
    if (persistenceError) toast.error(persistenceError, { id: "booth-storage-error" });
  }, [persistenceError]);

  React.useEffect(() => {
    if (!active) return;
    let timeout = 0;

    async function resetForInactivity() {
      sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
      sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
      window.speechSynthesis?.cancel();
      resetSession();
      await flushBoothSessionPersistence();
      toast.info("Session reset after 60 seconds without activity.");
      router.replace(base || "/");
    }

    function restartInactivityTimer() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => void resetForInactivity(), INACTIVITY_LIMIT_MS);
    }

    function protectActiveSession(event: BeforeUnloadEvent) {
      if (!navigator.onLine || window.matchMedia("(display-mode: standalone)").matches) return;
      event.preventDefault();
    }

    restartInactivityTimer();
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, restartInactivityTimer, { passive: true }));
    if (sessionId && capturedPhotoCount > 0) window.addEventListener("beforeunload", protectActiveSession);
    return () => {
      window.clearTimeout(timeout);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, restartInactivityTimer));
      window.removeEventListener("beforeunload", protectActiveSession);
    };
  }, [active, base, capturedPhotoCount, resetSession, router, sessionId]);

  return null;
}
