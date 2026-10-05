"use client";

import * as React from "react";
import Image from "next/image";
import { LoaderCircle, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { normalizeSocialUrl } from "@/lib/social-url";
import { cn } from "@/lib/utils";

export function SocialQrCode({ url, className }: { url: string; className?: string }) {
  const validUrl = normalizeSocialUrl(url);
  const [image, setImage] = React.useState<{ url: string; dataUrl: string } | null>(null);
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!validUrl) return;
    let active = true;
    QRCode.toDataURL(validUrl, { width: 900, margin: 2, color: { dark: "#101010", light: "#FFFFFF" }, errorCorrectionLevel: "M" })
      .then((dataUrl) => { if (active) { setImage({ url: validUrl, dataUrl }); setFailedUrl(null); } })
      .catch(() => { if (active) setFailedUrl(validUrl); });
    return () => { active = false; };
  }, [validUrl]);

  return (
    <div className={cn("grid aspect-square place-items-center bg-white p-4 text-center text-black", className)}>
      {validUrl && image?.url === validUrl ? <Image src={image.dataUrl} alt={`QR code for ${validUrl}`} width={900} height={900} unoptimized className="aspect-square w-full object-contain" /> : <div>{failedUrl === validUrl || !validUrl ? <QrCode className="mx-auto size-10" /> : <LoaderCircle className="mx-auto size-10 animate-spin" />}<p className="mt-3 text-sm font-bold">{failedUrl === validUrl ? "QR could not be generated" : !validUrl ? "Enter a valid link" : "Creating QR code"}</p></div>}
    </div>
  );
}
