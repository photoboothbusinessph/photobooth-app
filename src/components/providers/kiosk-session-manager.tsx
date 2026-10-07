"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { boothBasePath } from "@/lib/booth-path";
import { useBoothStore } from "@/stores/booth-store";

const INACTIVITY_LIMIT_MS = 60_000;
const timedRoutes = new Set(["/booth/templates", "/booth/camera", "/booth/preview"]);

export function KioskSessionManager() {
  const pathname = usePathname();
  const router = useRouter();
  const resetSession = useBoothStore((state) => state.resetSession);
  const base = boothBasePath(pathname);
  const active = timedRoutes.has(pathname.slice(base.length));

  React.useEffect(() => {
    if (!active) return;
    let timeout = 0;

    function resetForInactivity() {
      sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
      sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
      window.speechSynthesis?.cancel();
      resetSession();
      toast.info("Session reset after 60 seconds without activity.");
      router.replace(base || "/");
    }

    function restartInactivityTimer() {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(resetForInactivity, INACTIVITY_LIMIT_MS);
    }

    function protectActiveSession(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    restartInactivityTimer();
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, restartInactivityTimer, { passive: true }));
    window.addEventListener("beforeunload", protectActiveSession);
    return () => {
      window.clearTimeout(timeout);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, restartInactivityTimer));
      window.removeEventListener("beforeunload", protectActiveSession);
    };
  }, [active, base, resetSession, router]);

  return null;
}
