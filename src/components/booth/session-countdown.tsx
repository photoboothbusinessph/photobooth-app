"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { toast } from "sonner";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    let expired = false;
    const storedDeadline = Number(sessionStorage.getItem(BOOTH_SESSION_DEADLINE_KEY));
    if (!Number.isFinite(storedDeadline) || storedDeadline <= Date.now()) return;
    const deadline = storedDeadline;

    function updateCountdown() {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(nextRemaining);
      announceTimeWarning(nextRemaining);

      if (nextRemaining === 0 && !expired) {
        expired = true;
        sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
        sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
        window.speechSynthesis?.cancel();
        toast.error("Session expired. Start again when you’re ready.");
        router.replace("/");
      }
    }

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(interval);
  }, [router]);

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
