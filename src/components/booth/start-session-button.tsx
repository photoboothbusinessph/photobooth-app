"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { ArrowDownRight } from "lucide-react";
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
      className="group flex min-h-24 min-w-72 items-center justify-between border-2 border-white px-7 text-xl font-black uppercase tracking-[-0.03em] transition-colors hover:bg-white hover:text-black focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] lg:min-h-32"
    >
      {starting ? "Starting session" : !businessId ? "Business setup unavailable" : sessionHydrated ? "Tap to start" : "Preparing booth"}
      <ArrowDownRight className="size-8 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
    </button>
  );
}
