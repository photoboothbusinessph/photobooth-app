"use client";

import * as React from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinessStore } from "@/stores/business-store";
import { cacheBusinessSettings, queueSync } from "@/lib/db/indexed-db";
import type { ThemePalette } from "@/types";

const fields: { key: keyof ThemePalette; label: string; variable: string }[] = [
  { key: "primary", label: "Primary", variable: "--booth-primary" },
  { key: "secondary", label: "Secondary", variable: "--booth-secondary" },
  { key: "background", label: "Background", variable: "--booth-background" },
  { key: "text", label: "Text", variable: "--booth-text" },
  { key: "accent", label: "Accent", variable: "--booth-accent" },
];

export function ThemeEditor() {
  const palette = useBusinessStore((state) => state.palette);
  const setPalette = useBusinessStore((state) => state.updatePalette);
  const resetPalette = useBusinessStore((state) => state.resetPalette);
  const templates = useBusinessStore((state) => state.templates);
  const previewTemplate = templates.find((template) => template.isDefault) ?? templates[0];
  const [errors, setErrors] = React.useState<Partial<Record<keyof ThemePalette, boolean>>>({});

  function update(key: keyof ThemePalette, value: string) {
    const valid = /^#[0-9A-Fa-f]{6}$/.test(value);
    setErrors((current) => ({ ...current, [key]: !valid }));
    setPalette({ ...palette, [key]: value });
  }

  async function saveTheme() {
    const state = useBusinessStore.getState();
    await cacheBusinessSettings(state.branding, palette, { logoPublicId: state.logoPublicId, socialUrl: state.socialUrl, socialQrUrl: state.socialQrUrl, socialQrPublicId: state.socialQrPublicId }, state.isConfigured);
    await queueSync("business", "default");
    toast.success("Theme saved locally");
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="border border-black/15 bg-card p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(({ key, label }) => <div key={key} className="space-y-2"><Label htmlFor={`color-${key}`}>{label} color</Label><div className="flex gap-2"><input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(palette[key]) ? palette[key] : "#000000"} onChange={(event) => update(key, event.target.value.toUpperCase())} aria-label={`Pick ${label.toLowerCase()} color`} className="h-11 w-14 border bg-white p-1" /><Input id={`color-${key}`} value={palette[key]} onChange={(event) => update(key, event.target.value.toUpperCase())} aria-invalid={errors[key]} className="h-11 font-mono uppercase" /></div>{errors[key] ? <p className="text-xs font-bold text-destructive">Use a six-digit hex value.</p> : null}</div>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => void saveTheme()} disabled={Object.values(errors).some(Boolean)} className="h-11"><Save /> Save theme</Button><Button variant="outline" onClick={() => { resetPalette(); setErrors({}); }} className="h-11"><RotateCcw /> Reset palette</Button></div>
        <p className="mt-4 text-xs text-muted-foreground">The controls update the shared booth theme immediately for this browser session.</p>
      </section>
      <aside className="grid gap-5 sm:grid-cols-2 xl:sticky xl:top-24 xl:grid-cols-1 xl:self-start"><div className="flex min-h-72 items-center justify-center p-7" style={{ background: palette.primary, color: palette.text }}><div><p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: palette.accent }}>Live application theme</p><h2 className="mt-3 text-5xl font-black uppercase leading-[0.85] tracking-[-0.07em]">Make it yours.</h2><button type="button" className="mt-7 min-h-12 border-2 px-6 font-black uppercase" style={{ background: palette.accent, borderColor: palette.secondary, color: palette.secondary }}>Start session</button></div></div>{previewTemplate ? <div className="flex justify-center bg-muted p-6"><ReceiptPreview template={{ ...previewTemplate, palette }} compact /></div> : null}</aside>
    </div>
  );
}
