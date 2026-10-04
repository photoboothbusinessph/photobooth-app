"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { useBoothStore } from "@/stores/booth-store";

export function FinishSessionButton() {
  const router = useRouter();
  const resetSession = useBoothStore((state) => state.resetSession);

  function finishSession() {
    sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
    sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
    window.speechSynthesis?.cancel();
    resetSession();
    router.replace("/");
  }

  return <Button onClick={finishSession} className="mt-8 h-14 w-full rounded-none bg-[var(--booth-accent)] px-8 font-black uppercase text-black hover:bg-white sm:w-auto">Finish / New session</Button>;
}
