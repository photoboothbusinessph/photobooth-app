"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinessStore } from "@/stores/business-store";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";
import type { BusinessBranding } from "@/types";

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export function BrandingForm() {
  const isHydrated = useBusinessStore((state) => state.isHydrated);
  if (!isHydrated) return <StatusState type="loading" title="Loading branding" description="Preparing your business settings." className="min-h-80" />;
  return <HydratedBrandingForm />;
}

function HydratedBrandingForm() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);
  const storedBranding = useBusinessStore((state) => state.branding);
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const logoPublicId = useBusinessStore((state) => state.logoPublicId);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const socialQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const welcomeBackgroundUrl = useBusinessStore((state) => state.welcomeBackgroundUrl);
  const welcomeBackgroundPublicId = useBusinessStore((state) => state.welcomeBackgroundPublicId);
  const setAssetReferences = useBusinessStore((state) => state.setAssetReferences);
  const [name, setName] = React.useState(storedBranding.name);
  const [footer, setFooter] = React.useState(storedBranding.footerText);
  const [logo, setLogo] = React.useState<string | null>(storedBranding.logoDataUrl);
  const [logoMode, setLogoMode] = React.useState<"image" | "text">(storedBranding.logoMode ?? (storedBranding.logoDataUrl ? "image" : "text"));
  const [logoText, setLogoText] = React.useState(storedBranding.monogram);
  const [logoFont, setLogoFont] = React.useState<NonNullable<BusinessBranding["logoFont"]>>(storedBranding.logoFont ?? "editorial");
  const [logoColor, setLogoColor] = React.useState(storedBranding.logoColor ?? "");
  const [saved, setSaved] = React.useState(false);
  const [logoChanged, setLogoChanged] = React.useState(false);
  const [background, setBackground] = React.useState<string | null>(welcomeBackgroundUrl);
  const [backgroundChanged, setBackgroundChanged] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPEG, or WebP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose an image smaller than 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setLogo(typeof reader.result === "string" ? reader.result : null); setLogoChanged(true); setSaved(false); toast.success("Logo preview ready to upload"); };
    reader.readAsDataURL(file);
  }
  function chooseBackground(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPEG, or WebP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose an image smaller than 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setBackground(typeof reader.result === "string" ? reader.result : null); setBackgroundChanged(true); setSaved(false); toast.success("Background preview ready to upload"); };
    reader.readAsDataURL(file);
  }
  async function save() {
    if (!logoText.trim()) { toast.error("Enter text for the business logo."); return; }
    if (logoMode === "image" && !logo) { toast.error("Choose an image or select Text only."); return; }
    if (logoColor && !isHexColor(logoColor)) { toast.error("Use a six-digit hex color for the logo."); return; }
    setSaving(true);
    let uploadedPublicId: string | null = null;
    let uploadedBackgroundPublicId: string | null = null;
    let savedToServer = false;
    try {
      let nextLogo = logoMode === "text" && logo ? storedBranding.logoDataUrl : logo;
      let nextLogoPublicId = logoPublicId;
      let nextBackground = background;
      let nextBackgroundPublicId = welcomeBackgroundPublicId;
      if (logoChanged && logo && logoMode === "image") {
        if (!navigator.onLine) throw new Error("Connect to the internet to upload a new logo.");
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: logo, kind: "logo" }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Logo upload failed.");
        nextLogo = result.data.url;
        nextLogoPublicId = result.data.publicId;
        uploadedPublicId = result.data.publicId;
      } else if (logoChanged && !logo) {
        nextLogoPublicId = null;
      }
      if (backgroundChanged && background) {
        if (!navigator.onLine) throw new Error("Connect to the internet to upload a welcome background.");
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: background, kind: "welcome-background" }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Background upload failed.");
        nextBackground = result.data.url;
        nextBackgroundPublicId = result.data.publicId;
        uploadedBackgroundPublicId = result.data.publicId;
      } else if (backgroundChanged && !background) {
        nextBackgroundPublicId = null;
      }
      const nextBranding = { ...storedBranding, name, footerText: footer, monogram: logoText.trim(), logoMode, logoFont, logoColor: logoColor || undefined, logoDataUrl: nextLogo };
      const assets = { logoPublicId: nextLogoPublicId, socialUrl, socialQrUrl, socialQrPublicId, welcomeBackgroundUrl: nextBackground, welcomeBackgroundPublicId: nextBackgroundPublicId };
      if (navigator.onLine) {
        const response = await fetch("/api/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isConfigured: useBusinessStore.getState().isConfigured, branding: nextBranding, palette: useBusinessStore.getState().palette, ...assets }) });
        if (!response.ok) throw new Error("Unable to save branding. Please try again.");
        savedToServer = true;
      }
      updateBranding(nextBranding);
      setAssetReferences({ logoPublicId: nextLogoPublicId, welcomeBackgroundUrl: nextBackground, welcomeBackgroundPublicId: nextBackgroundPublicId });
      await cacheBusinessSettings(nextBranding, useBusinessStore.getState().palette, assets, useBusinessStore.getState().isConfigured);
      if (!navigator.onLine) await queueSync("business", "default");
      if (navigator.onLine && logoChanged && logoPublicId && logoPublicId !== nextLogoPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: logoPublicId }) });
      }
      if (navigator.onLine && backgroundChanged && welcomeBackgroundPublicId && welcomeBackgroundPublicId !== nextBackgroundPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: welcomeBackgroundPublicId }) });
      }
      setLogo(nextLogo);
      setBackground(nextBackground);
      setLogoChanged(false);
      setBackgroundChanged(false);
      setSaved(true);
      toast.success(navigator.onLine ? "Branding saved" : "Branding saved offline");
    } catch (error) {
      if (uploadedPublicId && !savedToServer) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedPublicId }) });
      }
      if (uploadedBackgroundPublicId && !savedToServer) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedBackgroundPublicId }) });
      }
      toast.error(error instanceof Error ? error.message : "Unable to save branding");
    } finally {
      setSaving(false);
    }
  }

  const draftBranding: BusinessBranding = { ...storedBranding, name, monogram: logoText.trim() || "Your logo", logoMode, logoFont, logoColor: isHexColor(logoColor) ? logoColor : undefined, logoDataUrl: logo };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="space-y-8">
        <div className="grid gap-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="footer-text">Receipt footer</Label><Input id="footer-text" value={footer} onChange={(event) => { setFooter(event.target.value); setSaved(false); }} className="h-11" /></div>
        </div>
        <div className="space-y-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Business logo</h2><p className="mt-1 text-xs text-muted-foreground">Choose an uploaded image or styled text.</p></div><ImagePlus className="size-5 text-primary" /></div>
          <fieldset><legend className="mb-2 text-sm font-medium">Logo type</legend><div className="grid grid-cols-2 gap-2">{(["image", "text"] as const).map((mode) => <button key={mode} type="button" aria-pressed={logoMode === mode} onClick={() => { setLogoMode(mode); setSaved(false); }} className={`min-h-11 border px-3 text-sm font-bold ${logoMode === mode ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{mode === "image" ? "Upload image" : "Text only"}</button>)}</div></fieldset>
          {logoMode === "image" ? <>
            <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP, up to 8 MB.</p>
            <div className="flex min-h-44 items-center justify-center border border-dashed bg-muted/35 p-6">{logo ? <Image src={logo} alt="Uploaded logo preview" width={240} height={120} unoptimized className="max-h-28 w-auto object-contain" /> : <p className="text-sm text-muted-foreground">Choose an image to preview your logo.</p>}</div>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={chooseLogo} aria-label="Upload business logo image" />
            <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => inputRef.current?.click()}><Upload /> {logo ? "Replace" : "Choose logo"}</Button><Button type="button" variant="destructive" className="h-11" onClick={() => { setLogo(null); setLogoChanged(true); setSaved(false); }} disabled={!logo}><Trash2 /> Remove</Button></div>
          </> : <>
            <div className="space-y-2"><Label htmlFor="logo-text">Logo text</Label><Input id="logo-text" value={logoText} maxLength={30} onChange={(event) => { setLogoText(event.target.value); setSaved(false); }} className="h-11" /></div>
            <div className="space-y-2"><Label htmlFor="logo-font">Font style</Label><select id="logo-font" value={logoFont} onChange={(event) => { setLogoFont(event.target.value as NonNullable<BusinessBranding["logoFont"]>); setSaved(false); }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="editorial">Editorial serif</option><option value="sans">Bold sans-serif</option><option value="mono">Monospace</option></select></div>
            <div className="space-y-2"><Label htmlFor="logo-color">Text color</Label><div className="flex gap-2"><input id="logo-color-picker" type="color" aria-label="Pick logo text color" value={isHexColor(logoColor) ? logoColor : "#101010"} onChange={(event) => { setLogoColor(event.target.value); setSaved(false); }} className="h-11 w-12 shrink-0 border p-1" /><Input id="logo-color" value={logoColor} placeholder="Auto" maxLength={7} aria-invalid={Boolean(logoColor && !isHexColor(logoColor))} onChange={(event) => { setLogoColor(event.target.value); setSaved(false); }} className="h-11" /></div><p className="text-xs text-muted-foreground">Leave blank for automatic contrast on the booth and receipt.</p></div>
            <div className="flex min-h-32 items-center justify-center overflow-hidden border border-dashed bg-muted/35 p-6"><BrandMark branding={draftBranding} className="break-all text-5xl" /></div>
          </>}
        </div>
        <div className="space-y-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Tap-to-Start background</h2><p className="mt-1 text-xs text-muted-foreground">Used only on the booth welcome screen. Portrait artwork works best on tablets.</p></div><ImagePlus className="size-5 text-primary" /></div>
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden border border-dashed bg-[var(--booth-primary)] p-6">
            {background ? <Image src={background} alt="Tap-to-Start background preview" fill sizes="800px" unoptimized className="object-cover" /> : <p className="relative z-10 text-sm font-bold text-white">Theme color fallback</p>}
          </div>
          <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={chooseBackground} aria-label="Upload Tap-to-Start background image" />
          <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => backgroundInputRef.current?.click()}><Upload /> {background ? "Replace" : "Choose background"}</Button><Button type="button" variant="destructive" className="h-11" onClick={() => { setBackground(null); setBackgroundChanged(true); setSaved(false); }} disabled={!background}><Trash2 /> Remove</Button></div>
        </div>
        <Button onClick={() => void save()} disabled={saving} className="h-12 w-full sm:w-auto">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save branding"}</Button>
      </section>
      <aside className="xl:sticky xl:top-24 xl:self-start"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live booth preview</p><div className="relative aspect-[3/5] overflow-hidden bg-[var(--booth-primary)] text-white">{background ? <Image src={background} alt="Tap-to-Start background preview" fill sizes="430px" unoptimized className="object-cover" /> : null}</div><p className="mt-2 text-xs text-muted-foreground">Guests can tap anywhere on this screen to begin.</p></aside>
    </div>
  );
}
