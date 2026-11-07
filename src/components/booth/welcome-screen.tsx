"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { StartSessionButton } from "@/components/booth/start-session-button";
import { useBusinessStore } from "@/stores/business-store";

export function WelcomeScreen() {
  const background = useBusinessStore((state) => state.welcomeBackgroundUrl);
  const video = useBusinessStore((state) => state.welcomeVideoUrl);
  const businessSlug = useBusinessStore((state) => state.businessSlug);
  const [failedVideoUrl, setFailedVideoUrl] = React.useState<string | null>(null);

  return (
    <main className="grain relative h-dvh min-h-0 overflow-hidden bg-[var(--booth-primary)] text-white">
      {background ? <Image src={background} alt="" fill sizes="100vw" priority unoptimized className="object-cover" /> : null}
      {video && video !== failedVideoUrl ? <video key={video} src={video} poster={background ?? undefined} autoPlay muted loop playsInline preload="auto" aria-hidden="true" onError={() => setFailedVideoUrl(video)} className="pointer-events-none absolute inset-0 size-full object-cover" /> : null}
      <Link
        href={businessSlug ? `/admin/login?business=${encodeURIComponent(businessSlug)}` : "/admin/login"}
        className="absolute top-6 right-6 z-20 inline-flex min-h-11 items-center px-2 text-xs font-bold uppercase tracking-[0.2em] text-white sm:top-8 sm:right-10"
      >
        Admin
      </Link>
      <StartSessionButton />
    </main>
  );
}
