"use client";

import * as React from "react";
import Image from "next/image";
import { QrCode, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { QrVisual } from "@/components/shared/qr-visual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { business } from "@/config/mock-data";

export function SocialQrForm() {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [hasQr, setHasQr] = React.useState(true);
  const [qrSrc, setQrSrc] = React.useState<string | null>(null);
  const [handle, setHandle] = React.useState(business.handle);
  const [saved, setSaved] = React.useState(false);
  function select(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) { if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; } setQrSrc(URL.createObjectURL(file)); setHasQr(true); setSaved(false); toast.success("QR preview replaced locally"); } }
  function save() { setSaved(true); toast.success("Social QR settings saved for this demo"); }
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6 border border-black/15 bg-card p-5 sm:p-7">
        <div className="space-y-2"><Label htmlFor="social-handle">Social handle or CTA</Label><Input id="social-handle" value={handle} onChange={(event) => { setHandle(event.target.value); setSaved(false); }} className="h-11" /></div>
        <div><Label>QR image</Label><div className="mt-2 flex min-h-44 flex-col items-center justify-center border border-dashed bg-muted/30 p-6 text-center"><QrCode className="size-8 text-primary" /><p className="mt-3 font-bold">{hasQr ? "Social QR configured" : "No QR configured"}</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, or WebP preview only.</p></div></div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={select} className="sr-only" />
        <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => fileRef.current?.click()} className="h-11"><Upload /> {hasQr ? "Replace" : "Choose QR"}</Button><Button variant="destructive" disabled={!hasQr} onClick={() => { setHasQr(false); setQrSrc(null); setSaved(false); }} className="h-11"><Trash2 /> Remove</Button></div>
        <Button onClick={save} disabled={!handle.trim()} className="h-11"><Save /> {saved ? "Saved locally" : "Save settings"}</Button>
      </section>
      <aside className="flex min-h-[500px] flex-col justify-between bg-[var(--booth-primary)] p-7 text-white xl:sticky xl:top-24 xl:self-start"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Guest screen preview</p><h2 className="mt-3 text-5xl font-black uppercase leading-[0.88] tracking-[-0.065em]">Scan to follow us on social media.</h2><p className="mt-4 font-bold">{handle || "@yourbusiness"}</p></div>{hasQr ? (qrSrc ? <div className="relative mt-7 aspect-square overflow-hidden bg-white p-4"><Image src={qrSrc} alt="Uploaded social QR preview" fill unoptimized className="object-contain p-4" /></div> : <QrVisual className="mt-7" label="Social QR preview" />) : <div className="mt-7 grid aspect-square place-items-center bg-white/10 p-8 text-center"><div><QrCode className="mx-auto size-12" /><p className="mt-3 font-bold">No social QR yet</p></div></div>}</aside>
    </div>
  );
}
