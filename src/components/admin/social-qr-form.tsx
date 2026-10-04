"use client";

import * as React from "react";
import Image from "next/image";
import { LoaderCircle, QrCode, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read this image."));
    reader.onerror = () => reject(new Error("Unable to read this image."));
    reader.readAsDataURL(file);
  });
}

export function SocialQrForm() {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const branding = useBusinessStore((state) => state.branding);
  const palette = useBusinessStore((state) => state.palette);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const logoPublicId = useBusinessStore((state) => state.logoPublicId);
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const setAssetReferences = useBusinessStore((state) => state.setAssetReferences);
  const [qrOverride, setQrOverride] = React.useState<string | null | undefined>(undefined);
  const qrSrc = qrOverride === undefined ? socialQrUrl : qrOverride;
  const [pendingDataUrl, setPendingDataUrl] = React.useState<string | null>(null);
  const [handle, setHandle] = React.useState(branding.handle);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPEG, or WebP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose an image smaller than 8 MB"); return; }
    try {
      const dataUrl = await readImage(file);
      setPendingDataUrl(dataUrl);
      setQrOverride(dataUrl);
      setSaved(false);
      toast.success("QR preview ready to upload");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to read this image");
    }
  }

  async function save() {
    setSaving(true);
    try {
      let nextUrl = qrSrc;
      let nextPublicId = socialQrPublicId;
      if (pendingDataUrl) {
        if (!navigator.onLine) throw new Error("Connect to the internet to upload a new QR image.");
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: pendingDataUrl, kind: "social-qr", previousPublicId: socialQrPublicId }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "QR upload failed.");
        nextUrl = result.data.url;
        nextPublicId = result.data.publicId;
      }
      const nextBranding = { ...branding, handle };
      updateBranding(nextBranding);
      setAssetReferences({ socialQrUrl: nextUrl, socialQrPublicId: nextPublicId });
      await cacheBusinessSettings(nextBranding, palette, { logoPublicId, socialQrUrl: nextUrl, socialQrPublicId: nextPublicId });
      await queueSync("business", "default");
      setQrOverride(nextUrl);
      setPendingDataUrl(null);
      setSaved(true);
      toast.success(navigator.onLine ? "Social QR saved" : "Social handle saved offline");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save social QR settings");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setQrOverride(null);
    setPendingDataUrl(null);
    setSaved(false);
    setAssetReferences({ socialQrUrl: null, socialQrPublicId: null });
    await cacheBusinessSettings({ ...branding, handle }, palette, { logoPublicId, socialQrUrl: null, socialQrPublicId: null });
    await queueSync("business", "default");
    if (socialQrPublicId && navigator.onLine) {
      const response = await fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: socialQrPublicId }) });
      if (!response.ok) toast.error("The QR was removed locally, but the cloud asset still needs cleanup.");
    }
    toast.success("Social QR removed");
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6 border border-black/15 bg-card p-5 sm:p-7">
        <div className="space-y-2"><Label htmlFor="social-handle">Social handle or CTA</Label><Input id="social-handle" value={handle} onChange={(event) => { setHandle(event.target.value); setSaved(false); }} className="h-11" /></div>
        <div><Label>QR image</Label><div className="mt-2 flex min-h-44 flex-col items-center justify-center border border-dashed bg-muted/30 p-6 text-center"><QrCode className="size-8 text-primary" /><p className="mt-3 font-bold">{qrSrc ? "Social QR configured" : "No QR configured"}</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, or WebP, up to 8 MB.</p></div></div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void select(event)} className="sr-only" />
        <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => fileRef.current?.click()} className="h-11"><Upload /> {qrSrc ? "Replace" : "Choose QR"}</Button><Button variant="destructive" disabled={!qrSrc || saving} onClick={() => void remove()} className="h-11"><Trash2 /> Remove</Button></div>
        <Button onClick={() => void save()} disabled={!handle.trim() || saving} className="h-11">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save settings"}</Button>
      </section>
      <aside className="flex min-h-[500px] flex-col justify-between bg-[var(--booth-primary)] p-7 text-white xl:sticky xl:top-24 xl:self-start"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Guest screen preview</p><h2 className="mt-3 text-5xl font-black uppercase leading-[0.88] tracking-[-0.065em]">Scan to follow us on social media.</h2><p className="mt-4 font-bold">{handle || "@yourbusiness"}</p></div>{qrSrc ? <div className="relative mt-7 aspect-square overflow-hidden bg-white p-4"><Image src={qrSrc} alt="Uploaded social QR preview" fill unoptimized className="object-contain p-4" /></div> : <div className="mt-7 grid aspect-square place-items-center bg-white/10 p-8 text-center"><div><QrCode className="mx-auto size-12" /><p className="mt-3 font-bold">No social QR yet</p></div></div>}</aside>
    </div>
  );
}
