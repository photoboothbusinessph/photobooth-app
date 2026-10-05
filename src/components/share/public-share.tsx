"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AtSign, Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BusinessBranding } from "@/types";

interface SharedPhotoData {
  sessionId: string;
  colorImageUrl: string;
  bwImageUrl: string;
  createdAt: string;
  branding: BusinessBranding;
  socialQrUrl: string | null;
  socialUrl: string | null;
}

export function PublicShare({ data }: { data: SharedPhotoData | null }) {
  const [mode, setMode] = React.useState<"color" | "bw">("color");
  const [downloading, setDownloading] = React.useState(false);

  if (!data) {
    return <main className="grid min-h-dvh place-items-center bg-neutral-950 p-5 text-white"><StatusState type="error" title="This photo link is unavailable" description="The link may be invalid, expired, or waiting for the booth to finish syncing." className="w-full max-w-lg border-white/20 bg-white/5 text-white" action={<Button nativeButton={false} render={<Link href="/" />} className="h-12">Return to booth</Button>} /></main>;
  }

  const activeImage = mode === "color" ? data.colorImageUrl : data.bwImageUrl;

  async function downloadPhoto() {
    setDownloading(true);
    try {
      const response = await fetch(activeImage);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data?.sessionId}-${mode}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`${mode === "color" ? "Color" : "Black-and-white"} receipt downloaded`);
    } catch {
      toast.error("Download unavailable. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-dvh bg-neutral-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/20 px-5 py-5"><BrandMark inverse branding={data.branding} /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Private photo</span></header>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[minmax(300px,0.95fr)_minmax(320px,1fr)] lg:py-16">
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[2/3.35] w-full max-w-[420px] overflow-hidden border-2 border-white/20 bg-white"><Image src={activeImage} alt={`${mode === "color" ? "Color" : "Black-and-white"} receipt`} fill priority sizes="(max-width: 1024px) 90vw, 420px" className="object-contain" /></div>
          <div className="grid grid-cols-2 gap-3" aria-label="Both available receipt versions">
            {(["color", "bw"] as const).map((value) => <button key={value} type="button" onClick={() => setMode(value)} aria-pressed={mode === value} className={cn("border-2 p-2 text-left", mode === value ? "border-[var(--booth-accent)]" : "border-white/20")}><div className="relative aspect-[2/3] overflow-hidden bg-white"><Image src={value === "color" ? data.colorImageUrl : data.bwImageUrl} alt={`${value === "color" ? "Color" : "Black-and-white"} version`} fill sizes="180px" className="object-contain" /></div><span className="mt-2 block text-xs font-black uppercase">{value === "color" ? "Color" : "Black & white"}</span></button>)}
          </div>
        </div>
        <section className="self-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Your {data.branding.name} receipt</p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.065em] sm:text-6xl">Both versions are yours.</h1>
          <p className="mt-4 text-sm leading-6 text-white/65">Session {data.sessionId} · {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.createdAt))}</p>
          <div className="mt-7 grid grid-cols-2 border border-white/40 p-1">
            {(["color", "bw"] as const).map((value) => <button key={value} type="button" onClick={() => setMode(value)} aria-pressed={mode === value} className={cn("min-h-12 font-black uppercase", mode === value ? "bg-white text-black" : "hover:bg-white/10")}>{value === "color" ? "Color" : "B&W"}</button>)}
          </div>
          <Button onClick={() => void downloadPhoto()} disabled={downloading} className="mt-4 h-14 w-full rounded-none bg-[var(--booth-primary)] font-black uppercase">{downloading ? <LoaderCircle className="animate-spin" /> : <Download />} {downloading ? "Downloading" : `Download ${mode === "color" ? "color" : "B&W"}`}</Button>
          <div className="mt-8 border-t border-white/20 pt-6"><p className="text-sm text-white/60">Stay connected with the booth.</p>{data.socialUrl ? <a href={data.socialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold hover:text-[var(--booth-accent)]"><AtSign className="size-5" /> Follow {data.branding.handle || data.branding.name}</a> : <span className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold"><AtSign className="size-5" /> {data.branding.handle || data.branding.name}</span>}{data.socialUrl ? <SocialQrCode url={data.socialUrl} className="mt-5 size-40 p-2" /> : data.socialQrUrl ? <div className="relative mt-5 size-40 bg-white p-2"><Image src={data.socialQrUrl} alt="Business social media QR code" fill sizes="160px" className="object-contain p-2" /></div> : null}</div>
        </section>
      </div>
    </main>
  );
}
