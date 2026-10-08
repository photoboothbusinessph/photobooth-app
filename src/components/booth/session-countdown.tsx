"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_DURATION_SECONDS, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { cn } from "@/lib/utils";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";

const voiceWarnings = [
  { seconds: 30, message: "Warning. Your session will end in 30 seconds." },
  { seconds: 10, message: "Final warning. Your session will end in 10 seconds." },
] as const;

function announceTimeWarning(remaining: number) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;

  const announced = new Set(
    (sessionStorage.getItem(BOOTH_SESSION_VOICE_WARNINGS_KEY) ?? "")
      .split(",")
      .filter(Boolean),
  );
  const dueWarnings = voiceWarnings.filter(
    ({ seconds }) => remaining > 0 && remaining <= seconds && !announced.has(String(seconds)),
  );

  if (dueWarnings.length === 0) return;

  dueWarnings.forEach(({ seconds }) => announced.add(String(seconds)));
  sessionStorage.setItem(BOOTH_SESSION_VOICE_WARNINGS_KEY, [...announced].join(","));

  const warning = dueWarnings.at(-1);
  if (!warning) return;

  window.speechSynthesis.cancel();
  const prompt = new SpeechSynthesisUtterance(warning.message);
  prompt.lang = "en-US";
  prompt.rate = 0.95;
  prompt.volume = 1;
  window.speechSynthesis.speak(prompt);
}

export function SessionCountdown() {
  const router = useBoothRouter();
  const pathname = usePathname();
  const resetSession = useBoothStore((state) => state.resetSession);
  const sessionHydrated = useBoothStore((state) => state.isHydrated);
  const startedAt = useBoothStore((state) => state.startedAt);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!sessionHydrated || !startedAt) return;
    let expired = false;
    const storedDeadline = Number(sessionStorage.getItem(BOOTH_SESSION_DEADLINE_KEY));
    const deadline = Number.isFinite(storedDeadline) && storedDeadline > 0
      ? storedDeadline
      : startedAt + BOOTH_SESSION_DURATION_SECONDS * 1000;
    sessionStorage.setItem(BOOTH_SESSION_DEADLINE_KEY, String(deadline));

    async function expireSession() {
      sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
      sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
      window.speechSynthesis?.cancel();
      resetSession();
      await flushBoothSessionPersistence();
      toast.error("Session expired. Start again when you’re ready.");
      router.replace(boothBasePath(pathname) || "/");
    }

    function updateCountdown() {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      announceTimeWarning(nextRemaining);

      if (nextRemaining === 0 && !expired) {
        expired = true;
        void expireSession();
      }
    }

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(interval);
  }, [pathname, resetSession, router, sessionHydrated, startedAt]);

  if (remaining === null) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className={cn("inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 bg-[var(--booth-accent)] px-3 py-2 font-black tabular-nums text-black", remaining <= 30 && "motion-safe:animate-pulse")} aria-label={`${remaining} seconds remaining`}>
      <Clock3 className="size-4" />
      <time dateTime={`PT${remaining}S`}>{minutes}:{seconds.toString().padStart(2, "0")}</time>
    </div>
  );
}
