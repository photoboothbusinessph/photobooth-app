"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY, createBoothSessionDeadline } from "@/lib/booth-session";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

export function StartSessionButton() {
  const router = useBoothRouter();
  const pathname = usePathname();
  const startBoothSession = useBoothStore((state) => state.startSession);
  const sessionHydrated = useBoothStore((state) => state.isHydrated);
  const businessId = useBusinessStore((state) => state.businessId);
  const [starting, setStarting] = useState(false);

  async function startSession() {
    if (!businessId || !sessionHydrated || starting) return;
    setStarting(true);
    const slug = boothSlug(pathname);
    if (slug && navigator.onLine) {
      try {
        const response = await fetch(`/api/kiosks/status?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) {
          toast.error(response.status === 401 || response.status === 403
            ? "This booth is not ready yet. Ask an admin to sign in and pair this device from Kiosks."
            : "Could not check booth availability. Please try again.");
          setStarting(false);
          return;
        }
      } catch {
        toast.error("Could not check booth availability. Please try again.");
        setStarting(false);
        return;
      }
    }
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen().catch(() => undefined);
    }
    try {
      startBoothSession(boothSlug(pathname) ?? "legacy", businessId);
      if (!(await flushBoothSessionPersistence())) throw new Error("Storage unavailable");
      sessionStorage.setItem(BOOTH_SESSION_DEADLINE_KEY, String(createBoothSessionDeadline()));
      sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
      router.push(`${boothBasePath(pathname)}/booth/templates`);
    } catch {
      toast.error("Cannot start: browser storage is unavailable. Free device space or enable site storage, then try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startSession()}
      disabled={!businessId || !sessionHydrated || starting}
      className="min-h-16 min-w-64 bg-transparent px-6 text-2xl font-medium uppercase tracking-[-0.03em] text-white transition-opacity hover:opacity-75 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] disabled:opacity-60 sm:text-4xl"
    >
      {starting ? "Starting session" : !businessId ? "Business setup unavailable" : sessionHydrated ? "Tap to start" : "Preparing booth"}
    </button>
  );
}
