"use client";

import * as React from "react";
import Link from "next/link";
import { AtSign, QrCode } from "lucide-react";
import { QrVisual } from "@/components/shared/qr-visual";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { business } from "@/config/mock-data";

export function SocialResult() {
  const [hasQr, setHasQr] = React.useState(true);
  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_420px]">
      <div className="order-2 lg:order-1">
        <span className="inline-flex items-center gap-2 border border-white/40 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em]"><AtSign className="size-4" /> Stay in the frame</span>
        <h2 className="mt-6 max-w-2xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.065em] sm:text-7xl">Follow the afterparty.</h2>
        <p className="mt-5 text-xl font-bold">{business.handle}</p>
        <label className="mt-7 flex items-center gap-3 text-sm font-bold text-white/70"><Switch checked={hasQr} onCheckedChange={setHasQr} /> Show configured QR</label>
        <Button nativeButton={false} render={<Link href="/" />} className="mt-8 h-14 w-full rounded-none bg-[var(--booth-accent)] px-8 font-black uppercase text-black hover:bg-white sm:w-auto">Finish / New session</Button>
      </div>
      <div className="order-1 border-2 border-black bg-white p-5 shadow-[10px_10px_0_#101010] lg:order-2">
        {hasQr ? <QrVisual label="Business social media QR code" /> : <div className="grid aspect-square place-items-center bg-neutral-100 p-8 text-center text-black"><div><QrCode className="mx-auto size-12" /><p className="mt-4 font-black uppercase">No social QR yet</p><p className="mt-2 text-sm text-black/55">Ask the host for the social handle above.</p></div></div>}
      </div>
    </div>
  );
}
