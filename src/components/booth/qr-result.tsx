"use client";

import * as React from "react";
import Image from "next/image";
import { CloudOff, LoaderCircle, QrCode, Wifi } from "lucide-react";
import QRCode from "qrcode";
import { useLiveQuery } from "dexie-react-hooks";
import { FinishSessionButton } from "@/components/booth/finish-session-button";
import { BrandMark } from "@/components/shared/brand-mark";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { photoboothDb } from "@/lib/db/indexed-db";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

export function QrResult() {
  const sessionId = useBoothStore((state) => state.sessionId);
  const immediateShareUrl = useBoothStore((state) => state.shareUrl);
  const branding = useBusinessStore((state) => state.branding);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const localSession = useLiveQuery(() => sessionId ? photoboothDb.sessions.get(sessionId) : undefined, [sessionId]);
  const [qrImage, setQrImage] = React.useState<{ shareUrl: string; dataUrl: string } | null>(null);
  const shareUrl = immediateShareUrl ?? (localSession?.shareToken && typeof window !== "undefined" ? `${window.location.origin}/share/${localSession.shareToken}` : null);
  const qrDataUrl = shareUrl && qrImage?.shareUrl === shareUrl ? qrImage.dataUrl : null;

  React.useEffect(() => {
    if (!shareUrl) return;
    let active = true;
    QRCode.toDataURL(shareUrl, {
      width: 900,
      margin: 2,
      color: { dark: "#101010", light: "#F7F6F2" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setQrImage({ shareUrl, dataUrl: url });
      })
      .catch(() => {
        if (active) setQrImage(null);
      });
    return () => {
      active = false;
    };
  }, [shareUrl]);

  const synced = Boolean(shareUrl && qrDataUrl);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-4 text-center sm:py-8">
      <BrandMark branding={branding} inverse className="max-w-full text-6xl sm:text-8xl lg:text-9xl" />
      <div className="mt-10 grid w-full max-w-5xl gap-8 sm:mt-14 md:grid-cols-2 md:gap-10">
        <section className="flex min-w-0 flex-col items-center">
          <div className="w-full max-w-[360px] border-2 border-black bg-white p-4 shadow-[10px_10px_0_#101010] sm:p-5">
            {qrDataUrl ? (
              <Image src={qrDataUrl} alt="Private digital photo QR code" width={900} height={900} unoptimized className="aspect-square w-full" />
            ) : (
              <div className="grid aspect-square place-items-center bg-neutral-100 p-6 text-center text-black">
                <div>
                  {localSession === undefined ? <LoaderCircle className="mx-auto size-12 animate-spin" /> : <CloudOff className="mx-auto size-12" />}
                  <p className="mt-4 font-black uppercase">{localSession === undefined ? "Checking share link" : "Online QR unavailable"}</p>
                  <p className="mt-2 text-sm text-black/60">Your receipt is saved locally and will sync when the connection returns.</p>
                </div>
              </div>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">Digital copy</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">Scan to download both color and black-and-white copies of your photos.</p>
          <div className="mt-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
            {synced ? <Wifi className="size-4 text-[var(--booth-accent)]" /> : <CloudOff className="size-4 text-orange-300" />}
            {synced ? "Private link ready" : "Waiting for online sync"}
          </div>
        </section>

        <section className="flex min-w-0 flex-col items-center">
          <div className="w-full max-w-[360px] border-2 border-black bg-white p-4 shadow-[10px_10px_0_#101010] sm:p-5">
            {socialUrl ? (
              <SocialQrCode url={socialUrl} />
            ) : socialQrUrl ? (
              <div className="relative aspect-square">
                <Image src={socialQrUrl} alt="Business social media QR code" fill sizes="360px" className="object-contain" />
              </div>
            ) : (
              <div className="grid aspect-square place-items-center bg-neutral-100 p-6 text-center text-black">
                <div>
                  <QrCode className="mx-auto size-12" />
                  <p className="mt-4 font-black uppercase">No social link configured</p>
                  <p className="mt-2 text-sm text-black/60">Ask the host for the business social account.</p>
                </div>
              </div>
            )}
          </div>
          <h2 className="mt-6 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">Social media</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">Scan to visit and follow {branding.handle || branding.name} on social media.</p>
        </section>
      </div>
      <FinishSessionButton />
    </div>
  );
}
