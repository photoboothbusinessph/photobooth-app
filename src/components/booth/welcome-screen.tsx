"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { StartSessionButton } from "@/components/booth/start-session-button";
import { useBusinessStore } from "@/stores/business-store";

export function WelcomeScreen() {
  const background = useBusinessStore((state) => state.welcomeBackgroundUrl);
  const businessSlug = useBusinessStore((state) => state.businessSlug);
  return (
    <main className="grain relative h-dvh min-h-0 overflow-hidden bg-[var(--booth-primary)] text-white">
      {background ? <Image src={background} alt="" fill sizes="100vw" priority unoptimized className="object-cover" /> : null}
      <Link
        href={businessSlug ? `/admin/login?business=${encodeURIComponent(businessSlug)}` : "/admin/login"}
        className="absolute top-6 right-6 z-20 inline-flex min-h-11 items-center px-2 text-xs font-bold uppercase tracking-[0.2em] text-white sm:top-8 sm:right-10"
      >
        Admin
      </Link>
      <div className="absolute inset-y-0 left-0 flex w-20 items-center justify-center sm:w-28">
        <p className="whitespace-nowrap text-5xl font-black uppercase tracking-[-0.07em] [writing-mode:vertical-rl] sm:text-7xl">Receipt Photobooth</p>
      </div>
      <div className="relative z-10 ml-20 flex h-full min-h-0 flex-col items-center px-5 py-[clamp(2rem,8dvh,6rem)] sm:ml-28 sm:px-10">
        <BrandMark inverse className="mt-[2dvh] break-all text-center text-7xl sm:text-9xl lg:text-[10rem]" />
        <div className="mt-auto mb-[8dvh]"><StartSessionButton /></div>
      </div>
    </main>
  );
}
