"use client";

import * as React from "react";
import Image from "next/image";
import { CloudOff, LoaderCircle, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useLiveQuery } from "dexie-react-hooks";
import { FinishSessionButton } from "@/components/booth/finish-session-button";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { photoboothDb } from "@/lib/db/indexed-db";
import {
  DEFAULT_DIGITAL_COPY_QR_LABEL,
  DEFAULT_PRIMARY_SOCIAL_QR_LABEL,
  DEFAULT_SECONDARY_SOCIAL_QR_LABEL,
  normalizeQrLabel,
} from "@/lib/social-qr-settings";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

export function QrResult() {
  const sessionId = useBoothStore((state) => state.sessionId);
  const immediateShareUrl = useBoothStore((state) => state.shareUrl);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const secondarySocialUrl = useBusinessStore((state) => state.secondarySocialUrl);
  const primaryLabel = useBusinessStore((state) => state.socialQrLabel);
  const secondaryLabel = useBusinessStore((state) => state.secondarySocialQrLabel);
  const digitalLabel = useBusinessStore((state) => state.digitalCopyQrLabel);
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
      <div className="grid min-h-0 w-full max-w-4xl flex-1 grid-cols-2 grid-rows-2 place-items-center gap-x-[clamp(0.75rem,4vw,3rem)] gap-y-[clamp(0.35rem,1dvh,0.8rem)]">
        <QrResultCard label={normalizeQrLabel(primaryLabel, DEFAULT_PRIMARY_SOCIAL_QR_LABEL)}>
          {socialUrl ? (
            <SocialQrCode url={socialUrl} />
          ) : socialQrUrl ? (
            <div className="relative aspect-square">
              <Image src={socialQrUrl} alt="Primary business social QR code" fill sizes="240px" className="object-contain" />
            </div>
          ) : (
            <MissingSocialQr />
          )}
        </QrResultCard>

        <QrResultCard label={normalizeQrLabel(secondaryLabel, DEFAULT_SECONDARY_SOCIAL_QR_LABEL)}>
          {secondarySocialUrl ? <SocialQrCode url={secondarySocialUrl} /> : <MissingSocialQr />}
        </QrResultCard>

        <QrResultCard label={normalizeQrLabel(digitalLabel, DEFAULT_DIGITAL_COPY_QR_LABEL)} className="col-span-2">
          {qrDataUrl ? (
            <Image src={qrDataUrl} alt="Private digital photo QR code" width={900} height={900} unoptimized className="aspect-square w-full" />
          ) : (
            <div className="grid aspect-square place-items-center bg-neutral-100 p-4 text-center text-black">
              <div>
                {localSession === undefined ? <LoaderCircle className="mx-auto size-9 animate-spin" /> : <CloudOff className="mx-auto size-9" />}
                <p className="mt-3 text-sm font-black uppercase">{localSession === undefined ? "Checking share link" : "Online QR unavailable"}</p>
                <p className="mt-1 text-xs text-black/60">The receipt remains saved on this device.</p>
              </div>
            </div>
          )}
        </QrResultCard>
      </div>
      <FinishSessionButton />
    </div>
  );
}

function QrResultCard({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <section className={`flex min-w-0 flex-col items-center ${className}`}>
    <div className="w-full max-w-[min(20dvh,230px)] border-2 border-black bg-white p-[clamp(0.3rem,0.7dvh,0.65rem)] shadow-[5px_5px_0_#101010]">
      {children}
    </div>
    <h2 className="mt-[clamp(0.25rem,0.65dvh,0.55rem)] max-w-[18rem] text-[clamp(0.85rem,2dvh,1.45rem)] font-black uppercase leading-tight tracking-[-0.035em]">{label}</h2>
  </section>;
}

function MissingSocialQr() {
  return <div className="grid aspect-square place-items-center bg-neutral-100 p-4 text-center text-black"><div><QrCode className="mx-auto size-9" /><p className="mt-3 text-sm font-black uppercase">No link configured</p></div></div>;
}
