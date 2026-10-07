"use client";

import { usePathname, useRouter } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";
import { ArrowDownRight } from "lucide-react";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY, createBoothSessionDeadline } from "@/lib/booth-session";
import { useBoothStore } from "@/stores/booth-store";

export function StartSessionButton() {
  const router = useRouter();
  const pathname = usePathname();
  const startBoothSession = useBoothStore((state) => state.startSession);

  async function startSession() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => undefined);
    }
    startBoothSession();
    sessionStorage.setItem(BOOTH_SESSION_DEADLINE_KEY, String(createBoothSessionDeadline()));
    sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
    router.push(`${boothBasePath(pathname)}/booth/templates`);
  }

  return (
    <button
      type="button"
      onClick={() => void startSession()}
      className="group flex min-h-24 min-w-72 items-center justify-between border-2 border-white px-7 text-xl font-black uppercase tracking-[-0.03em] transition-colors hover:bg-white hover:text-black focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] lg:min-h-32"
    >
      Tap to start
      <ArrowDownRight className="size-8 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
    </button>
  );
}
