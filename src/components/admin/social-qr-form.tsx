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
import {
  DEFAULT_DIGITAL_COPY_QR_LABEL,
  DEFAULT_PRIMARY_SOCIAL_QR_LABEL,
  DEFAULT_SECONDARY_SOCIAL_QR_LABEL,
  normalizeQrLabel,
} from "@/lib/social-qr-settings";
import { normalizeSocialUrl } from "@/lib/social-url";
import { useBusinessStore } from "@/stores/business-store";

export function SocialQrForm() {
  const isHydrated = useBusinessStore((state) => state.isHydrated);
  if (!isHydrated) return <StatusState type="loading" title="Loading social settings" description="Preparing your social links." className="min-h-80" />;
  return <HydratedSocialQrForm />;
}

function HydratedSocialQrForm() {
  const branding = useBusinessStore((state) => state.branding);
  const socialUrl = useBusinessStore((state) => state.socialUrl);
  const secondarySocialUrl = useBusinessStore((state) => state.secondarySocialUrl);
  const storedPrimaryLabel = useBusinessStore((state) => state.socialQrLabel);
  const storedSecondaryLabel = useBusinessStore((state) => state.secondarySocialQrLabel);
  const storedDigitalLabel = useBusinessStore((state) => state.digitalCopyQrLabel);
  const legacyQrUrl = useBusinessStore((state) => state.socialQrUrl);
  const legacyQrPublicId = useBusinessStore((state) => state.socialQrPublicId);
  const [handle, setHandle] = React.useState(branding.handle);
  const [primaryUrl, setPrimaryUrl] = React.useState(socialUrl ?? "");
  const [secondaryUrl, setSecondaryUrl] = React.useState(secondarySocialUrl ?? "");
  const [primaryLabel, setPrimaryLabel] = React.useState(storedPrimaryLabel);
  const [secondaryLabel, setSecondaryLabel] = React.useState(storedSecondaryLabel);
  const [digitalLabel, setDigitalLabel] = React.useState(storedDigitalLabel);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const validPrimaryUrl = primaryUrl.trim() ? normalizeSocialUrl(primaryUrl) : null;
  const validSecondaryUrl = secondaryUrl.trim() ? normalizeSocialUrl(secondaryUrl) : null;
  const invalidPrimaryUrl = Boolean(primaryUrl.trim() && !validPrimaryUrl);
  const invalidSecondaryUrl = Boolean(secondaryUrl.trim() && !validSecondaryUrl);
  const labelsValid = Boolean(primaryLabel.trim() && secondaryLabel.trim() && digitalLabel.trim());

  async function save(overrides?: { primaryUrl?: string | null; secondaryUrl?: string | null }) {
    const nextPrimaryUrl = overrides && "primaryUrl" in overrides ? overrides.primaryUrl ?? null : validPrimaryUrl;
    const nextSecondaryUrl = overrides && "secondaryUrl" in overrides ? overrides.secondaryUrl ?? null : validSecondaryUrl;
    const nextPrimaryLabel = normalizeQrLabel(primaryLabel, DEFAULT_PRIMARY_SOCIAL_QR_LABEL);
    const nextSecondaryLabel = normalizeQrLabel(secondaryLabel, DEFAULT_SECONDARY_SOCIAL_QR_LABEL);
    const nextDigitalLabel = normalizeQrLabel(digitalLabel, DEFAULT_DIGITAL_COPY_QR_LABEL);

    setSaving(true);
    try {
      const state = useBusinessStore.getState();
      const nextBranding = { ...state.branding, handle: handle.trim() };
      const qrSettings = {
        socialUrl: nextPrimaryUrl,
        socialQrUrl: null,
        socialQrPublicId: null,
        socialQrLabel: nextPrimaryLabel,
        secondarySocialUrl: nextSecondaryUrl,
        secondarySocialQrLabel: nextSecondaryLabel,
        digitalCopyQrLabel: nextDigitalLabel,
      };
      const cachedSettings = { logoPublicId: state.logoPublicId, ...qrSettings };

      if (navigator.onLine) {
        const response = await fetch("/api/business", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isConfigured: state.isConfigured, branding: nextBranding, palette: state.palette, ...qrSettings }),
        });
        const result = await response.json() as { error?: { message?: string } };
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to save QR settings. Please try again.");
      }

      state.updateBranding(nextBranding);
      state.setAssetReferences(qrSettings);
      await cacheBusinessSettings(nextBranding, state.palette, cachedSettings, state.isConfigured);
      if (!navigator.onLine) await queueSync("business", "default");
      if (navigator.onLine && legacyQrPublicId) {
        void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: legacyQrPublicId }) });
      }
      setPrimaryUrl(nextPrimaryUrl ?? "");
      setSecondaryUrl(nextSecondaryUrl ?? "");
      setPrimaryLabel(nextPrimaryLabel);
      setSecondaryLabel(nextSecondaryLabel);
      setDigitalLabel(nextDigitalLabel);
      setSaved(true);
      toast.success("QR settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save QR settings");
    } finally {
      setSaving(false);
    }
  }

  function markChanged() {
    setSaved(false);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <section className="space-y-5 border border-black/15 bg-card p-5 sm:p-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Social QR 1</p><h2 className="mt-1 text-xl font-bold">Primary social or business link</h2></div>
          <div className="space-y-2"><Label htmlFor="social-handle">Social handle or CTA</Label><Input id="social-handle" value={handle} maxLength={80} onChange={(event) => { setHandle(event.target.value); markChanged(); }} className="h-11" /></div>
          <QrFields id="primary-social" url={primaryUrl} label={primaryLabel} invalidUrl={invalidPrimaryUrl} onUrlChange={(value) => { setPrimaryUrl(value); markChanged(); }} onLabelChange={(value) => { setPrimaryLabel(value); markChanged(); }} />
          <Button variant="outline" disabled={(!socialUrl && !legacyQrUrl) || saving} onClick={() => void save({ primaryUrl: null })} className="h-11"><Trash2 /> Remove first link</Button>
        </section>

        <section className="space-y-5 border border-black/15 bg-card p-5 sm:p-7">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Social QR 2</p><h2 className="mt-1 text-xl font-bold">Additional social or business link</h2></div>
          <QrFields id="secondary-social" url={secondaryUrl} label={secondaryLabel} invalidUrl={invalidSecondaryUrl} onUrlChange={(value) => { setSecondaryUrl(value); markChanged(); }} onLabelChange={(value) => { setSecondaryLabel(value); markChanged(); }} />
          <Button variant="outline" disabled={!secondarySocialUrl || saving} onClick={() => void save({ secondaryUrl: null })} className="h-11"><Trash2 /> Remove second link</Button>
        </section>

        <section className="space-y-2 border border-black/15 bg-card p-5 sm:p-7">
          <Label htmlFor="digital-copy-label">Digital copy QR label</Label>
          <Input id="digital-copy-label" value={digitalLabel} maxLength={40} onChange={(event) => { setDigitalLabel(event.target.value); markChanged(); }} className="h-11" />
          <p className="text-sm text-muted-foreground">This label appears below the guest&apos;s private receipt download QR code.</p>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void save()} disabled={invalidPrimaryUrl || invalidSecondaryUrl || !labelsValid || saving} className="h-11">{saving ? <LoaderCircle className="animate-spin" /> : <Save />} {saving ? "Saving…" : saved ? "Saved" : "Save QR settings"}</Button>
          <p className="text-xs text-muted-foreground">Links generate QR codes automatically; no QR image upload is needed.</p>
        </div>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <QrPreview title="Guest screen preview 1" handle={handle} url={validPrimaryUrl} legacyQrUrl={!invalidPrimaryUrl ? legacyQrUrl : null} label={primaryLabel} invalid={invalidPrimaryUrl} />
        <QrPreview title="Guest screen preview 2" url={validSecondaryUrl} label={secondaryLabel} invalid={invalidSecondaryUrl} />
      </aside>
    </div>
  );
}

function QrFields({ id, url, label, invalidUrl, onUrlChange, onLabelChange }: { id: string; url: string; label: string; invalidUrl: boolean; onUrlChange: (value: string) => void; onLabelChange: (value: string) => void }) {
  return <>
    <div className="space-y-2"><Label htmlFor={`${id}-url`}>Profile or business link</Label><Input id={`${id}-url`} type="url" inputMode="url" placeholder="https://instagram.com/yourbusiness" value={url} maxLength={2048} aria-invalid={invalidUrl} aria-describedby={`${id}-url-help`} onChange={(event) => onUrlChange(event.target.value)} className="h-11" /><p id={`${id}-url-help`} className={invalidUrl ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{invalidUrl ? "Enter a full HTTP or HTTPS link." : "The QR code updates automatically as you enter a link."}</p></div>
    <div className="space-y-2"><Label htmlFor={`${id}-label`}>Label below QR code</Label><Input id={`${id}-label`} value={label} maxLength={40} onChange={(event) => onLabelChange(event.target.value)} className="h-11" /><p className="text-sm text-muted-foreground">Shown below this QR code on the customer screen.</p></div>
  </>;
}

function QrPreview({ title, handle, url, legacyQrUrl, label, invalid }: { title: string; handle?: string; url: string | null; legacyQrUrl?: string | null; label: string; invalid: boolean }) {
  return <section className="flex min-h-[460px] flex-col justify-between bg-[var(--booth-primary)] p-7 text-white">
    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">{title}</p><h2 className="mt-3 text-4xl font-black uppercase leading-[0.88] tracking-[-0.06em]">Scan our social or business QR.</h2>{handle ? <p className="mt-4 break-all font-bold">{handle}</p> : null}</div>
    <div className="mt-7">
      {url ? <SocialQrCode url={url} /> : legacyQrUrl && !invalid ? <div className="relative aspect-square bg-white p-4"><Image src={legacyQrUrl} alt="Previously uploaded social QR code" fill sizes="420px" className="object-contain p-4" /></div> : <div className="grid aspect-square place-items-center bg-white/10 p-8 text-center"><div><QrCode className="mx-auto size-12" /><p className="mt-3 font-bold">{invalid ? "Enter a valid link" : "No link yet"}</p></div></div>}
      <p className="mt-4 text-center text-lg font-black uppercase">{label || "QR label"}</p>
    </div>
  </section>;
}
