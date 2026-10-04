"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CloudOff, LoaderCircle, Wifi } from "lucide-react";
import QRCode from "qrcode";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { photoboothDb } from "@/lib/db/indexed-db";
import { useBoothStore } from "@/stores/booth-store";

export function QrResult({ templateId }: { templateId?: string }) {
  const sessionId = useBoothStore((state) => state.sessionId);
  const immediateShareUrl = useBoothStore((state) => state.shareUrl);
  const localSession = useLiveQuery(() => sessionId ? photoboothDb.sessions.get(sessionId) : undefined, [sessionId]);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const shareUrl = immediateShareUrl ?? (localSession?.shareToken && typeof window !== "undefined" ? `${window.location.origin}/share/${localSession.shareToken}` : null);

  React.useEffect(() => {
    if (!shareUrl) return;
    let active = true;
    QRCode.toDataURL(shareUrl, { width: 900, margin: 2, color: { dark: "#101010", light: "#F7F6F2" }, errorCorrectionLevel: "M" })
      .then((url) => { if (active) setQrDataUrl(url); })
      .catch(() => { if (active) setQrDataUrl(null); });
    return () => { active = false; };
  }, [shareUrl]);

  const synced = Boolean(shareUrl && qrDataUrl);

  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[420px_1fr]">
      <div className="border-2 border-black bg-white p-5 shadow-[12px_12px_0_#101010]">
        {qrDataUrl ? <Image src={qrDataUrl} alt="Private photo download QR code" width={900} height={900} unoptimized className="aspect-square w-full" /> : <div className="grid aspect-square place-items-center bg-neutral-100 p-8 text-center text-black"><div>{localSession === undefined ? <LoaderCircle className="mx-auto size-12 animate-spin" /> : <CloudOff className="mx-auto size-12" />}<p className="mt-4 font-black uppercase">{localSession === undefined ? "Checking share link" : "Online QR unavailable"}</p><p className="mt-2 text-sm text-black/60">The receipt is saved locally and will sync when the connection returns.</p></div></div>}
      </div>
      <div>
        <div className="inline-flex items-center gap-3 border border-white/50 px-4 py-3">{synced ? <Wifi className="size-5 text-[var(--booth-accent)]" /> : <CloudOff className="size-5 text-orange-300" />}<span className="text-sm font-bold">{synced ? "Private link ready" : "Waiting for online sync"}</span></div>
        <h2 className="mt-7 max-w-2xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.065em] sm:text-5xl">Scan this QR code to download the soft copy of your photos.</h2>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/75">The private page includes both color and black-and-white versions.</p>
        <Button nativeButton={false} render={<Link href={templateId ? `/booth/social?template=${templateId}` : "/booth/social"} />} className="mt-8 h-14 w-full rounded-none bg-[var(--booth-accent)] px-7 font-black uppercase text-black hover:bg-white sm:w-auto">Continue <ArrowRight /></Button>
      </div>
    </div>
  );
}
