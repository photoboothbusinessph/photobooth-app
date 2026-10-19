"use client";

import * as React from "react";
import Image from "next/image";
import { CloudOff, LoaderCircle, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useLiveQuery } from "dexie-react-hooks";
import { FinishSessionButton } from "@/components/booth/finish-session-button";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { photoboothDb } from "@/lib/db/indexed-db";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

export function QrResult() {
  const sessionId = useBoothStore((state) => state.sessionId);
  const immediateShareUrl = useBoothStore((state) => state.shareUrl);
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

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
      <div className="grid min-h-0 w-full max-w-5xl flex-1 grid-cols-2 gap-[clamp(0.6rem,2vw,1.5rem)]">
        <section className="flex min-w-0 flex-col items-center">
          <div className="w-full max-w-[min(26dvh,280px)] border-2 border-black bg-white p-[clamp(0.4rem,1dvh,0.8rem)] shadow-[6px_6px_0_#101010]">
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
          <h2 className="mt-[clamp(0.35rem,1dvh,0.8rem)] text-[clamp(1rem,2.5dvh,1.8rem)] font-black uppercase tracking-[-0.04em]">Digital copy</h2>
        </section>

        <section className="flex min-w-0 flex-col items-center">
          <div className="w-full max-w-[min(26dvh,280px)] border-2 border-black bg-white p-[clamp(0.4rem,1dvh,0.8rem)] shadow-[6px_6px_0_#101010]">
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
          <h2 className="mt-[clamp(0.35rem,1dvh,0.8rem)] text-[clamp(1rem,2.5dvh,1.8rem)] font-black uppercase tracking-[-0.04em]">Social media</h2>
        </section>
      </div>
      <FinishSessionButton />
    </div>
  );
}
