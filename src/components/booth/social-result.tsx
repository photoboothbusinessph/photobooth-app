"use client";

import Image from "next/image";
import { AtSign, QrCode } from "lucide-react";
import { FinishSessionButton } from "@/components/booth/finish-session-button";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { useBusinessStore } from "@/stores/business-store";

export function SocialResult() {
  const handle = useBusinessStore((state) => state.branding.handle);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_420px]">
      <div className="order-2 lg:order-1">
        <span className="inline-flex items-center gap-2 border border-white/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em]"><AtSign className="size-4" /> Stay in the frame</span>
        <h2 className="mt-6 max-w-2xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.065em] sm:text-7xl">Scan to follow us on social media.</h2>
        <p className="mt-5 text-xl font-bold">{handle || "Ask the host for the social link"}</p>
        <FinishSessionButton />
      </div>
      <div className="order-1 border-2 border-black bg-white p-5 shadow-[10px_10px_0_#101010] lg:order-2">
        {socialUrl ? <SocialQrCode url={socialUrl} /> : socialQrUrl ? <div className="relative aspect-square"><Image src={socialQrUrl} alt="Business social media QR code" fill sizes="420px" className="object-contain" /></div> : <div className="grid aspect-square place-items-center bg-neutral-100 p-8 text-center text-black"><div><QrCode className="mx-auto size-12" /><p className="mt-4 font-black uppercase">No social QR yet</p><p className="mt-2 text-sm text-black/55">Ask the host for the social handle above.</p></div></div>}
      </div>
    </div>
  );
}
