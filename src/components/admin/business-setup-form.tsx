"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusState } from "@/components/shared/status-state";
import { cacheBusinessSettings } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import type { ThemePalette } from "@/types";

const paletteFields: Array<{ key: keyof ThemePalette; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
  { key: "accent", label: "Accent" },
];

export function BusinessSetupForm() {
  const isHydrated = useBusinessStore((state) => state.isHydrated);
  if (!isHydrated) {
    return <StatusState type="loading" title="Loading business settings" description="Preparing the reusable booth configuration." className="min-h-80" />;
  }
  return <HydratedBusinessSetupForm />;
}

function HydratedBusinessSetupForm() {
  const router = useRouter();
  const branding = useBusinessStore((state) => state.branding);
  const storedPalette = useBusinessStore((state) => state.palette);
  const updateBranding = useBusinessStore((state) => state.updateBranding);
  const updatePalette = useBusinessStore((state) => state.updatePalette);
  const setConfigured = useBusinessStore((state) => state.setConfigured);
  const [palette, setPalette] = React.useState(storedPalette);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const monogram = String(form.get("monogram") ?? "").trim();
    if (!name || !monogram) {
      setError("Business name and monogram are required.");
      return;
    }

    const nextBranding = {
      ...branding,
      name,
      monogram,
      handle: String(form.get("handle") ?? "").trim(),
      headerText: String(form.get("headerText") ?? "").trim(),
      footerText: String(form.get("footerText") ?? "").trim(),
      customMessage: String(form.get("customMessage") ?? "").trim(),
    };

    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isConfigured: true,
          branding: nextBranding,
          palette,
          logoPublicId: null,
          socialUrl: null,
          socialQrUrl: null,
          socialQrPublicId: null,
        }),
      });
      const result = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to save business setup.");
      updateBranding(nextBranding);
      updatePalette(palette);
      setConfigured(true);
      await cacheBusinessSettings(nextBranding, palette, {}, true);
      toast.success("Business setup complete");
      router.replace("/admin");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Unable to save business setup.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-7">
        <section className="grid gap-5 border border-black/15 bg-card p-5 sm:grid-cols-2 sm:p-7">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" defaultValue={branding.name} maxLength={80} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monogram">Short logo text</Label>
            <Input
              id="monogram"
              name="monogram"
              defaultValue={branding.monogram}
              maxLength={30}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handle">Social handle</Label>
            <Input
              id="handle"
              name="handle"
              defaultValue={branding.handle}
              maxLength={80}
              placeholder="@yourbusiness"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="headerText">Booth headline</Label>
            <Input
              id="headerText"
              name="headerText"
              defaultValue={branding.headerText}
              maxLength={120}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="footerText">Receipt footer</Label>
            <Input
              id="footerText"
              name="footerText"
              defaultValue={branding.footerText}
              maxLength={120}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="customMessage">Guest message</Label>
            <Textarea
              id="customMessage"
              name="customMessage"
              defaultValue={branding.customMessage}
              maxLength={500}
              rows={3}
            />
          </div>
        </section>
        <section className="border border-black/15 bg-card p-5 sm:p-7">
          <h2 className="font-bold">Starting theme</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can fine-tune these colors later.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {paletteFields.map(({ key, label }) => (
              <label
                key={key}
                className="flex min-h-14 items-center gap-3 border border-black/15 p-3 text-sm font-bold"
              >
                <input
                  type="color"
                  value={palette[key]}
                  onChange={(event) =>
                    setPalette((current) => ({
                      ...current,
                      [key]: event.target.value.toUpperCase(),
                    }))
                  }
                  className="size-9 cursor-pointer border-0 bg-transparent"
                  aria-label={`${label} color`}
                />
                <span>{label}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {palette[key]}
                </span>
              </label>
            ))}
          </div>
        </section>
        {error ? (
          <p role="alert" className="text-sm font-bold text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={saving} className="h-12 w-full rounded-none sm:w-auto">
          {saving ? <LoaderCircle className="animate-spin" /> : <Check />}{" "}
          {saving ? "Saving setup" : "Complete setup"}
        </Button>
      </div>
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Live preview
        </p>
        <div
          className="grain flex aspect-[4/5] flex-col justify-between p-7"
          style={{ backgroundColor: palette.primary, color: "#fff" }}
        >
          <strong className="display-serif text-5xl">{branding.monogram || "YB"}</strong>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: palette.accent }}
            >
              Your receipt booth
            </p>
            <p className="mt-4 text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em]">
              Ready for your brand.
            </p>
          </div>
          <span className="border-t border-white/30 pt-4 text-xs font-bold uppercase tracking-[0.18em]">
            Reusable setup
          </span>
        </div>
      </aside>
    </form>
  );
}
