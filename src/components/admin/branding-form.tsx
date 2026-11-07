"use client";

import * as React from "react";
import Image from "next/image";
import { Film, ImagePlus, LoaderCircle, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinessStore } from "@/stores/business-store";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";
import { removeWelcomeVideoFromCache, warmWelcomeVideoCache, WELCOME_VIDEO_MAX_BYTES, WELCOME_VIDEO_MIME_TYPE } from "@/lib/welcome-video";
import type { BoothPageBackgroundKey, BoothPageBackgrounds, BusinessBranding } from "@/types";

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);
const boothPages: Array<{ key: BoothPageBackgroundKey; label: string; step: string }> = [
  { key: "layout", label: "Photo Layout", step: "01 / 05" },
  { key: "camera", label: "Camera", step: "02 / 05" },
  { key: "design", label: "Design Selection", step: "03 / 05" },
  { key: "preview", label: "Print Preview", step: "04 / 05" },
  { key: "qr", label: "QR Result", step: "05 / 05" },
];

type WelcomeVideoSignature = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  overwrite: string;
  allowedFormats: string;
  expectedPublicId: string;
};

type WelcomeVideoUploadResult = {
  secure_url?: string;
  public_id?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  error?: { message?: string };
};

export function BrandingForm() {
  const isHydrated = useBusinessStore((state) => state.isHydrated);
  if (!isHydrated) return <StatusState type="loading" title="Loading branding" description="Preparing your business settings." className="min-h-80" />;
  return <HydratedBrandingForm />;
}

function HydratedBrandingForm() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const backgroundInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const videoObjectUrlRef = React.useRef<string | null>(null);
  const pageBackgroundInputRefs = React.useRef<Partial<Record<BoothPageBackgroundKey, HTMLInputElement | null>>>({});
  const storedBranding = useBusinessStore((state) => state.branding);
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const logoPublicId = useBusinessStore((state) => state.logoPublicId);
  const socialQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const socialQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const welcomeBackgroundUrl = useBusinessStore((state) => state.welcomeBackgroundUrl);
  const welcomeBackgroundPublicId = useBusinessStore((state) => state.welcomeBackgroundPublicId);
  const welcomeVideoUrl = useBusinessStore((state) => state.welcomeVideoUrl);
  const welcomeVideoPublicId = useBusinessStore((state) => state.welcomeVideoPublicId);
  const storedPageBackgrounds = useBusinessStore((state) => state.boothPageBackgrounds);
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
  const [video, setVideo] = React.useState<string | null>(welcomeVideoUrl);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoChanged, setVideoChanged] = React.useState(false);
  const [pageBackgrounds, setPageBackgrounds] = React.useState<BoothPageBackgrounds>(storedPageBackgrounds);
  const [changedPageBackgrounds, setChangedPageBackgrounds] = React.useState<Set<BoothPageBackgroundKey>>(() => new Set());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => () => {
    if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
  }, []);

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
  function chooseVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== WELCOME_VIDEO_MIME_TYPE || !/\.mp4$/i.test(file.name)) { toast.error("Choose an MP4 video"); return; }
    if (file.size > WELCOME_VIDEO_MAX_BYTES) { toast.error("Choose an MP4 video no larger than 25 MB"); return; }
    if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    videoObjectUrlRef.current = objectUrl;
    setVideo(objectUrl);
    setVideoFile(file);
    setVideoChanged(true);
    setSaved(false);
    toast.success("Video preview ready to upload");
  }
  function removeVideo() {
    if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
    videoObjectUrlRef.current = null;
    setVideo(null);
    setVideoFile(null);
    setVideoChanged(true);
    setSaved(false);
  }
  function choosePageBackground(key: BoothPageBackgroundKey, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPEG, or WebP image"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Choose an image smaller than 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setPageBackgrounds((current) => ({ ...current, [key]: { url: reader.result as string, publicId: current[key]?.publicId ?? "" } }));
      setChangedPageBackgrounds((current) => new Set(current).add(key));
      setSaved(false);
      toast.success(`${boothPages.find((page) => page.key === key)?.label ?? "Page"} background preview ready`);
    };
    reader.readAsDataURL(file);
  }
  function removePageBackground(key: BoothPageBackgroundKey) {
    setPageBackgrounds((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setChangedPageBackgrounds((current) => new Set(current).add(key));
    setSaved(false);
  }
  async function uploadWelcomeVideo(file: File) {
    const signatureResponse = await fetch("/api/uploads/video-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileSize: file.size, mimeType: file.type }),
    });
    const signatureResult = await signatureResponse.json() as { data?: WelcomeVideoSignature; error?: { message?: string } };
    if (!signatureResponse.ok || !signatureResult.data) {
      throw new Error(signatureResult.error?.message ?? "Unable to prepare the video upload.");
    }

    const signature = signatureResult.data;
    const formData = new FormData();
    formData.set("file", file);
    formData.set("api_key", signature.apiKey);
    formData.set("timestamp", String(signature.timestamp));
    formData.set("signature", signature.signature);
    formData.set("folder", signature.folder);
    formData.set("public_id", signature.publicId);
    formData.set("overwrite", signature.overwrite);
    formData.set("allowed_formats", signature.allowedFormats);

    const uploadResponse = await fetch(signature.uploadUrl, { method: "POST", body: formData });
    const uploaded = await uploadResponse.json() as WelcomeVideoUploadResult;
    if (!uploadResponse.ok) throw new Error(uploaded.error?.message ?? "Video upload failed.");
    if (
      !uploaded.secure_url
      || uploaded.public_id !== signature.expectedPublicId
      || uploaded.resource_type !== "video"
      || uploaded.format !== "mp4"
      || typeof uploaded.bytes !== "number"
      || uploaded.bytes > WELCOME_VIDEO_MAX_BYTES
    ) {
      void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: signature.expectedPublicId, resourceType: "video" }) });
      throw new Error("The uploaded video response could not be verified.");
    }
    return { url: uploaded.secure_url, publicId: uploaded.public_id };
  }
  async function save() {
    if (!logoText.trim()) { toast.error("Enter text for the business logo."); return; }
    if (logoMode === "image" && !logo) { toast.error("Choose an image or select Text only."); return; }
    if (logoColor && !isHexColor(logoColor)) { toast.error("Use a six-digit hex color for the logo."); return; }
    setSaving(true);
    let uploadedPublicId: string | null = null;
    let uploadedBackgroundPublicId: string | null = null;
    let uploadedVideoPublicId: string | null = null;
    const uploadedPagePublicIds: string[] = [];
    let savedToServer = false;
    try {
      let nextLogo = logoMode === "text" && logo ? storedBranding.logoDataUrl : logo;
      let nextLogoPublicId = logoPublicId;
      let nextBackground = background;
      let nextBackgroundPublicId = welcomeBackgroundPublicId;
      let nextVideo = video;
      let nextVideoPublicId = welcomeVideoPublicId;
      const nextPageBackgrounds: BoothPageBackgrounds = { ...pageBackgrounds };
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
      if (videoChanged) {
        if (!navigator.onLine) throw new Error("Connect to the internet to update the welcome video.");
        if (videoFile) {
          const uploadedVideo = await uploadWelcomeVideo(videoFile);
          nextVideo = uploadedVideo.url;
          nextVideoPublicId = uploadedVideo.publicId;
          uploadedVideoPublicId = uploadedVideo.publicId;
        } else {
          nextVideo = null;
          nextVideoPublicId = null;
        }
      }
      if (changedPageBackgrounds.size && !navigator.onLine) throw new Error("Connect to the internet to upload booth page backgrounds.");
      for (const key of changedPageBackgrounds) {
        const draft = pageBackgrounds[key];
        if (!draft) {
          delete nextPageBackgrounds[key];
          continue;
        }
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: draft.url, kind: "booth-page-background" }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Booth page background upload failed.");
        nextPageBackgrounds[key] = result.data;
        uploadedPagePublicIds.push(result.data.publicId);
      }
      const nextBranding = { ...storedBranding, name, footerText: footer, monogram: logoText.trim(), logoMode, logoFont, logoColor: logoColor || undefined, logoDataUrl: nextLogo };
      const assets = { logoPublicId: nextLogoPublicId, socialUrl, socialQrUrl, socialQrPublicId, welcomeBackgroundUrl: nextBackground, welcomeBackgroundPublicId: nextBackgroundPublicId, welcomeVideoUrl: nextVideo, welcomeVideoPublicId: nextVideoPublicId, boothPageBackgrounds: nextPageBackgrounds };
      if (navigator.onLine) {
        const response = await fetch("/api/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isConfigured: useBusinessStore.getState().isConfigured, branding: nextBranding, palette: useBusinessStore.getState().palette, ...assets }) });
        if (!response.ok) throw new Error("Unable to save branding. Please try again.");
        savedToServer = true;
      }
      updateBranding(nextBranding);
      setAssetReferences({ logoPublicId: nextLogoPublicId, welcomeBackgroundUrl: nextBackground, welcomeBackgroundPublicId: nextBackgroundPublicId, welcomeVideoUrl: nextVideo, welcomeVideoPublicId: nextVideoPublicId, boothPageBackgrounds: nextPageBackgrounds });
      await cacheBusinessSettings(nextBranding, useBusinessStore.getState().palette, assets, useBusinessStore.getState().isConfigured);
      if (!navigator.onLine) await queueSync("business", "default");
      if (navigator.onLine && logoChanged && logoPublicId && logoPublicId !== nextLogoPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: logoPublicId }) });
      }
      if (navigator.onLine && backgroundChanged && welcomeBackgroundPublicId && welcomeBackgroundPublicId !== nextBackgroundPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: welcomeBackgroundPublicId }) });
      }
      if (videoChanged && welcomeVideoPublicId && welcomeVideoPublicId !== nextVideoPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: welcomeVideoPublicId, resourceType: "video" }) });
      }
      if (videoChanged && welcomeVideoUrl && welcomeVideoUrl !== nextVideo) {
        void removeWelcomeVideoFromCache(welcomeVideoUrl);
      }
      for (const key of changedPageBackgrounds) {
        const previousPublicId = storedPageBackgrounds[key]?.publicId;
        if (previousPublicId && previousPublicId !== nextPageBackgrounds[key]?.publicId) {
          void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: previousPublicId }) });
        }
      }
      setLogo(nextLogo);
      setBackground(nextBackground);
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
      setVideo(nextVideo);
      setVideoFile(null);
      setPageBackgrounds(nextPageBackgrounds);
      setLogoChanged(false);
      setBackgroundChanged(false);
      setVideoChanged(false);
      setChangedPageBackgrounds(new Set());
      setSaved(true);
      if (nextVideo && navigator.onLine) {
        void warmWelcomeVideoCache(nextVideo).catch(() => toast.warning("Video saved, but this device could not cache it for offline playback yet."));
      }
      toast.success(navigator.onLine ? "Branding saved" : "Branding saved offline");
    } catch (error) {
      if (uploadedPublicId && !savedToServer) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedPublicId }) });
      }
      if (uploadedBackgroundPublicId && !savedToServer) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedBackgroundPublicId }) });
      }
      if (uploadedVideoPublicId && !savedToServer) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedVideoPublicId, resourceType: "video" }) });
      }
      for (const publicId of uploadedPagePublicIds) {
        if (!savedToServer) void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId }) });
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
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Tap-to-Start background</h2><p className="mt-1 text-xs text-muted-foreground">Add an image, a silent looping MP4, or both. Portrait artwork works best on tablets.</p></div><ImagePlus className="size-5 text-primary" /></div>
          <div className="relative flex min-h-56 items-center justify-center overflow-hidden border border-dashed bg-[var(--booth-primary)] p-6">
            {background ? <Image src={background} alt="Tap-to-Start image background preview" fill sizes="800px" unoptimized className="object-cover" /> : null}
            {video ? <video key={video} src={video} poster={background ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-label="Tap-to-Start video background preview" className="absolute inset-0 z-10 size-full object-cover" /> : null}
            {!background && !video ? <p className="relative z-20 text-sm font-bold text-white">Theme color fallback</p> : null}
          </div>
          <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={chooseBackground} aria-label="Upload Tap-to-Start background image" />
          <input ref={videoInputRef} type="file" accept="video/mp4,.mp4" className="sr-only" onChange={chooseVideo} aria-label="Upload Tap-to-Start MP4 background video" />
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Background image</p>
              <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => backgroundInputRef.current?.click()} disabled={saving}><Upload /> {background ? "Replace image" : "Choose image"}</Button><Button type="button" variant="destructive" className="h-11" onClick={() => { setBackground(null); setBackgroundChanged(true); setSaved(false); }} disabled={!background || saving}><Trash2 /> Remove image</Button></div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Background video</p>
              <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => videoInputRef.current?.click()} disabled={saving}><Film /> {video ? "Replace MP4" : "Choose MP4"}</Button><Button type="button" variant="destructive" className="h-11" onClick={removeVideo} disabled={!video || saving}><Trash2 /> Remove video</Button></div>
              <p className="mt-2 text-xs text-muted-foreground">MP4 only, up to 25 MB. Use a short portrait H.264 video for reliable tablet playback.</p>
            </div>
          </div>
        </div>
        <div className="space-y-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold">Booth page backgrounds</h2>
              <p className="mt-1 text-xs text-muted-foreground">Upload a separate full-screen background for each guest step. PNG, JPEG, or WebP, up to 8 MB.</p>
            </div>
            <ImagePlus className="size-5 shrink-0 text-primary" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {boothPages.map((page) => {
              const asset = pageBackgrounds[page.key];
              return (
                <article key={page.key} className="space-y-3 border border-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold">{page.label}</h3>
                    <span className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground">{page.step}</span>
                  </div>
                  <div className="relative aspect-[3/4] overflow-hidden border bg-[var(--booth-primary)] text-white">
                    {asset ? <Image src={asset.url} alt={`${page.label} background preview`} fill sizes="320px" unoptimized className="object-cover" /> : null}
                    <div className="absolute inset-0 z-10 flex flex-col p-3">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.12em]">
                        <span>← Back</span>
                        <span>{page.step}</span>
                      </div>
                      <div className="m-auto rounded border border-white/70 bg-black/10 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.12em]">
                        {asset ? page.label : "Theme color fallback"}
                      </div>
                    </div>
                  </div>
                  <input
                    ref={(element) => { pageBackgroundInputRefs.current[page.key] = element; }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => choosePageBackground(page.key, event)}
                    aria-label={`Upload ${page.label} background image`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => pageBackgroundInputRefs.current[page.key]?.click()}>
                      <Upload /> {asset ? "Replace" : "Upload"}
                    </Button>
                    <Button type="button" variant="destructive" className="h-11" onClick={() => removePageBackground(page.key)} disabled={!asset} aria-label={`Remove ${page.label} background`}>
                      <Trash2 />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <Button onClick={() => void save()} disabled={saving} className="h-12 w-full sm:w-auto">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save branding"}</Button>
      </section>
      <aside className="xl:sticky xl:top-24 xl:self-start"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live booth preview</p><div className="relative aspect-[3/5] overflow-hidden bg-[var(--booth-primary)] text-white">{background ? <Image src={background} alt="Tap-to-Start image background preview" fill sizes="430px" unoptimized className="object-cover" /> : null}{video ? <video key={video} src={video} poster={background ?? undefined} autoPlay muted loop playsInline preload="metadata" aria-hidden className="absolute inset-0 z-10 size-full object-cover" /> : null}</div><p className="mt-2 text-xs text-muted-foreground">Video plays first. The image and theme color remain as fallbacks. Guests can tap anywhere to begin.</p></aside>
    </div>
  );
}
