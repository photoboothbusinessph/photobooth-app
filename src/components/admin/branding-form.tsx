"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessStore } from "@/stores/business-store";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";

export function BrandingForm() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const storedBranding = useBusinessStore((state) => state.branding);
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const logoPublicId = useBusinessStore((state) => state.logoPublicId);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const setAssetReferences = useBusinessStore((state) => state.setAssetReferences);
  const [name, setName] = React.useState(storedBranding.name);
  const [header, setHeader] = React.useState(storedBranding.headerText);
  const [footer, setFooter] = React.useState(storedBranding.footerText);
  const [message, setMessage] = React.useState(storedBranding.customMessage);
  const [logo, setLogo] = React.useState<string | null>(storedBranding.logoDataUrl);
  const [saved, setSaved] = React.useState(false);
  const [logoChanged, setLogoChanged] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPEG, or WebP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose an image smaller than 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setLogo(typeof reader.result === "string" ? reader.result : null); setLogoChanged(true); setSaved(false); toast.success("Logo preview ready to upload"); };
    reader.readAsDataURL(file);
  }
  async function save() {
    setSaving(true);
    try {
      let nextLogo = logo;
      let nextLogoPublicId = logoPublicId;
      if (logoChanged && logo) {
        if (!navigator.onLine) throw new Error("Connect to the internet to upload a new logo.");
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: logo, kind: "logo", previousPublicId: logoPublicId }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Logo upload failed.");
        nextLogo = result.data.url;
        nextLogoPublicId = result.data.publicId;
      } else if (logoChanged && !logo && logoPublicId && navigator.onLine) {
        const response = await fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: logoPublicId }) });
        if (!response.ok) throw new Error("Logo removal failed.");
        nextLogoPublicId = null;
      }
      const nextBranding = { ...storedBranding, name, headerText: header, footerText: footer, customMessage: message, logoDataUrl: nextLogo };
      const assets = { logoPublicId: nextLogoPublicId, socialQrUrl, socialQrPublicId };
      updateBranding(nextBranding);
      setAssetReferences({ logoPublicId: nextLogoPublicId });
      await cacheBusinessSettings(nextBranding, useBusinessStore.getState().palette, assets);
      await queueSync("business", "default");
      setLogo(nextLogo);
      setLogoChanged(false);
      setSaved(true);
      toast.success(navigator.onLine ? "Branding saved" : "Branding saved offline");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="space-y-8">
        <div className="grid gap-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="header-text">Receipt header</Label><Input id="header-text" value={header} onChange={(event) => { setHeader(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="footer-text">Receipt footer</Label><Input id="footer-text" value={footer} onChange={(event) => { setFooter(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="message">Guest message</Label><Textarea id="message" value={message} onChange={(event) => { setMessage(event.target.value); setSaved(false); }} rows={4} /></div>
        </div>
        <div className="border border-black/15 bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Business logo</h2><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, or WebP, up to 8 MB.</p></div><ImagePlus className="size-5 text-primary" /></div>
          <div className="mt-5 flex min-h-44 items-center justify-center border border-dashed bg-muted/35 p-6">{logo ? <Image src={logo} alt="Uploaded logo preview" width={240} height={120} unoptimized className="max-h-28 w-auto object-contain" /> : <BrandMark className="text-5xl" />}</div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={chooseLogo} />
          <div className="mt-4 flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => inputRef.current?.click()}><Upload /> {logo ? "Replace" : "Choose logo"}</Button><Button type="button" variant="destructive" className="h-11" onClick={() => { setLogo(null); setLogoChanged(true); setSaved(false); }} disabled={!logo}><Trash2 /> Remove</Button></div>
        </div>
        <Button onClick={() => void save()} disabled={saving} className="h-12 w-full sm:w-auto">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save branding"}</Button>
      </section>
      <aside className="xl:sticky xl:top-24 xl:self-start"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live booth preview</p><div className="grain flex aspect-[4/5] flex-col justify-between overflow-hidden bg-[var(--booth-primary)] p-7 text-white"><div className="flex items-center justify-between">{logo ? <Image src={logo} alt="Live logo preview" width={120} height={60} unoptimized className="max-h-12 w-auto object-contain brightness-0 invert" /> : <BrandMark inverse />}<span className="text-[10px] font-bold uppercase tracking-[0.18em]">Receipt booth</span></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--booth-accent)]">{header || "Your header"}</p><h3 className="mt-4 break-words text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em]">{name || "Your Business"}</h3><p className="mt-5 max-w-xs text-sm text-white/70">{message}</p></div><p className="border-t border-white/30 pt-4 text-xs font-bold uppercase tracking-[0.18em]">{footer}</p></div></aside>
    </div>
  );
}
