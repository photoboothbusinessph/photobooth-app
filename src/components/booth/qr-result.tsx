"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CloudOff, Wifi } from "lucide-react";
import { QrVisual } from "@/components/shared/qr-visual";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function QrResult({ templateId }: { templateId?: string }) {
  const [online, setOnline] = React.useState(true);
  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[420px_1fr]">
      <div className="border-2 border-black bg-white p-5 shadow-[10px_10px_0_#101010]">
        {online ? <QrVisual /> : <div className="grid aspect-square place-items-center bg-neutral-100 text-center text-black"><div><CloudOff className="mx-auto size-14" /><p className="mt-4 text-lg font-black uppercase">Sharing unavailable</p><p className="mx-auto mt-2 max-w-56 text-sm text-black/60">Reconnect to create a share link for this session.</p></div></div>}
      </div>
      <div>
        <div className="inline-flex items-center gap-3 border border-white/40 px-4 py-3">
          {online ? <Wifi className="size-5 text-[var(--booth-accent)]" /> : <CloudOff className="size-5" />}
          <span className="text-sm font-bold">{online ? "Online result" : "Offline unavailable"}</span>
          <Switch checked={online} onCheckedChange={setOnline} aria-label="Toggle online state" />
        </div>
        <h2 className="mt-7 max-w-2xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.065em] sm:text-5xl">Scan this QR code to download the soft copy of your photos.</h2>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/75">Open the private photo page to view and download both color and black-and-white versions.</p>
        <Button nativeButton={false} render={<Link href={templateId ? `/booth/social?template=${templateId}` : "/booth/social"} />} className="mt-8 h-14 w-full rounded-none bg-[var(--booth-accent)] px-7 font-black uppercase text-black hover:bg-white sm:w-auto" disabled={!online}>Continue <ArrowRight /></Button>
      </div>
    </div>
  );
}
