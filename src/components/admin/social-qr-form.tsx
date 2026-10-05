"use client";

import * as React from "react";
import Image from "next/image";
import { LoaderCircle, QrCode, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SocialQrCode } from "@/components/shared/social-qr-code";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";
import { normalizeSocialUrl } from "@/lib/social-url";
import { useBusinessStore } from "@/stores/business-store";

export function SocialQrForm() {
  const isHydrated = useBusinessStore((state) => state.isHydrated);
  if (!isHydrated) return <StatusState type="loading" title="Loading social settings" description="Preparing your social link." className="min-h-80" />;
  return <HydratedSocialQrForm />;
}

function HydratedSocialQrForm() {
  const branding = useBusinessStore((state) => state.branding);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const legacyQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const legacyQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const [handle, setHandle] = React.useState(branding.handle);
  const [url, setUrl] = React.useState(socialUrl ?? "");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const validUrl = url.trim() ? normalizeSocialUrl(url) : null;
  const invalidUrl = Boolean(url.trim() && !validUrl);

  async function save(nextUrl: string | null) {
    setSaving(true);
    try {
      const state = useBusinessStore.getState();
      const nextBranding = { ...state.branding, handle: handle.trim() };
      const assets = { logoPublicId: state.logoPublicId, socialUrl: nextUrl, socialQrUrl: null, socialQrPublicId: null };
      if (navigator.onLine) {
        const response = await fetch("/api/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isConfigured: state.isConfigured, branding: nextBranding, palette: state.palette, ...assets }) });
        if (!response.ok) throw new Error("Unable to save social link. Please try again.");
      }
      state.updateBranding(nextBranding);
      state.setAssetReferences({ socialUrl: nextUrl, socialQrUrl: null, socialQrPublicId: null });
      await cacheBusinessSettings(nextBranding, state.palette, assets, state.isConfigured);
      if (!navigator.onLine) await queueSync("business", "default");
      if (navigator.onLine && legacyQrPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: legacyQrPublicId }) });
      }
      setUrl(nextUrl ?? "");
      setSaved(true);
      toast.success(nextUrl ? "Social QR saved" : "Social link removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save social link");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="space-y-6 border border-black/15 bg-card p-5 sm:p-7">
        <div className="space-y-2"><Label htmlFor="social-handle">Social handle or CTA</Label><Input id="social-handle" value={handle} maxLength={80} onChange={(event) => { setHandle(event.target.value); setSaved(false); }} className="h-11" /></div>
        <div className="space-y-2"><Label htmlFor="social-url">Social profile link</Label><Input id="social-url" type="url" inputMode="url" placeholder="https://instagram.com/yourbusiness" value={url} maxLength={2048} aria-invalid={invalidUrl} aria-describedby="social-url-help" onChange={(event) => { setUrl(event.target.value); setSaved(false); }} className="h-11" /><p id="social-url-help" className={invalidUrl ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{invalidUrl ? "Enter a full HTTP or HTTPS link." : "The QR code updates automatically as you enter a link."}</p></div>
        <div className="flex flex-wrap gap-3"><Button onClick={() => void save(validUrl)} disabled={!validUrl || saving} className="h-11">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save social QR"}</Button><Button variant="outline" disabled={(!socialUrl && !legacyQrUrl) || saving} onClick={() => void save(null)} className="h-11"><Trash2 /> Remove link</Button></div>
        <p className="text-xs text-muted-foreground">A link is required for guests to scan and open your social page. No QR image upload is needed.</p>
      </section>
      <aside className="flex min-h-[500px] flex-col justify-between bg-[var(--booth-primary)] p-7 text-white xl:sticky xl:top-24 xl:self-start"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Guest screen preview</p><h2 className="mt-3 text-5xl font-black uppercase leading-[0.88] tracking-[-0.065em]">Scan to follow us on social media.</h2><p className="mt-4 break-all font-bold">{handle || "@yourbusiness"}</p></div>{validUrl ? <SocialQrCode url={validUrl} className="mt-7" /> : legacyQrUrl && !invalidUrl ? <div className="relative mt-7 aspect-square bg-white p-4"><Image src={legacyQrUrl} alt="Previously uploaded social QR code" fill sizes="420px" className="object-contain p-4" /></div> : <div className="mt-7 grid aspect-square place-items-center bg-white/10 p-8 text-center"><div><QrCode className="mx-auto size-12" /><p className="mt-3 font-bold">{invalidUrl ? "Enter a valid link" : "No social link yet"}</p></div></div>}</aside>
    </div>
  );
}
