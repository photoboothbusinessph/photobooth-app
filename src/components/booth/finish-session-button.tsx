"use client";

import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { Button } from "@/components/ui/button";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";

export function FinishSessionButton() {
  const router = useBoothRouter();
  const pathname = usePathname();
  const resetSession = useBoothStore((state) => state.resetSession);

  async function finishSession() {
    sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
    sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
    window.speechSynthesis?.cancel();
    resetSession();
    await flushBoothSessionPersistence();
    router.replace(boothBasePath(pathname) || "/");
  }

  return <Button onClick={() => void finishSession()} className="mt-8 h-14 w-full rounded-none bg-[var(--booth-accent)] px-8 font-black uppercase text-black hover:bg-white sm:w-auto">Finish / New session</Button>;
}
