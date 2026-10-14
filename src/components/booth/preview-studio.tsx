"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { FlipHorizontal2, LoaderCircle, Minus, Plus, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { saveLocalSession } from "@/lib/db/indexed-db";
import { normalizeReceiptTemplate } from "@/lib/receipt/template-rules";
import { renderReceiptImage } from "@/lib/receipt/render-receipt";
import { shareReceiptWithEasyThermal } from "@/lib/receipt/easy-thermal";
import { setReceiptPrinting } from "@/lib/receipt/print-activity";
import { processSyncQueue, syncSessionNow } from "@/lib/sync/client-sync";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";
import type { ReceiptTemplate } from "@/types";

export function PreviewStudio({ template }: { template: ReceiptTemplate }) {
  const normalizedTemplate = React.useMemo(() => normalizeReceiptTemplate(template), [template]);
  const router = useBoothRouter();
  const pathname = usePathname();
  const base = boothBasePath(pathname);
  const [rendering, setRendering] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [mirrored, setMirrored] = React.useState(false);
  const [copies, setCopies] = React.useState(1);
  const savedImageRef = React.useRef<string | null>(null);
  const dispatchingRef = React.useRef(false);
  const continuingRef = React.useRef(false);
  const [renderError, setRenderError] = React.useState(false);
  const sessionId = useBoothStore((state) => state.sessionId);
  const photos = useBoothStore((state) => state.capturedPhotos);
  const generatedImages = useBoothStore((state) => state.generatedImages);
  const setGeneratedImages = useBoothStore((state) => state.setGeneratedImages);
  const beginCapture = useBoothStore((state) => state.beginCapture);
  const completeSession = useBoothStore((state) => state.completeSession);
  const setShareResult = useBoothStore((state) => state.setShareResult);
  const branding = useBusinessStore((state) => state.branding);
  const businessId = useBusinessStore((state) => state.businessId);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      renderReceiptImage({ template: normalizedTemplate, photos, branding, palette: normalizedTemplate.palette, monochrome: false, mirrored }),
      renderReceiptImage({ template: normalizedTemplate, photos, branding, palette: normalizedTemplate.palette, monochrome: true, mirrored }),
    ]).then(([color, bw]) => {
      if (cancelled) return;
      setGeneratedImages({ color, bw });
    })
      .catch(() => { if (!cancelled) { setRenderError(true); toast.error("The final receipt image could not be generated. Try Mirror again or retake the photos."); } })
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [branding, mirrored, normalizedTemplate, photos, setGeneratedImages]);

  React.useEffect(() => () => { setReceiptPrinting(false); }, []);

  async function persistReceipt() {
    const businessSlug = boothSlug(pathname);
    if (!sessionId || !generatedImages || !businessId || !businessSlug) throw new Error("This kiosk needs a completed online setup before saving photos.");
    if (savedImageRef.current === generatedImages.color) return;
    await saveLocalSession({ id: sessionId, businessId, businessSlug, templateId: normalizedTemplate.id, photos, colorImage: generatedImages.color, bwImage: generatedImages.bw });
    savedImageRef.current = generatedImages.color;
  }

  async function openPrint() {
    if (!/Android/i.test(navigator.userAgent)) {
      toast.error("Printing requires an Android phone or tablet with Easy Thermal Print. Browser printing is disabled.");
      return;
    }
    if (dispatchingRef.current || continuingRef.current || rendering || saving || sharing || !generatedImages) return;
    dispatchingRef.current = true;
    setReceiptPrinting(true);
    setSharing(true);
    window.speechSynthesis?.cancel();
    try {
      await shareReceiptWithEasyThermal(generatedImages.color, copies);
      toast.info(`Receipt shared. Print ${copies} ${copies === 1 ? "copy" : "copies"} in Easy Thermal Print.`);
      await saveAndContinue();
    } catch (error) {
      setReceiptPrinting(false);
      if (error instanceof DOMException && error.name === "AbortError")
        toast.info("Printing was cancelled. Tap Print when you are ready.");
      else toast.error(error instanceof Error ? error.message : "Could not share the receipt to Easy Thermal Print.");
    } finally {
      dispatchingRef.current = false;
      setSharing(false);
    }
  }

  async function retakePhotos() {
    beginCapture();
    await flushBoothSessionPersistence();
    router.push(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(normalizedTemplate.id)}`}`);
  }

  function toggleMirror() {
    setRenderError(false);
    setRendering(true);
    setMirrored((value) => !value);
  }

  async function saveAndContinue() {
    if (!sessionId || !generatedImages || saving || continuingRef.current) return;
    const businessSlug = boothSlug(pathname);
    if (!businessId || !businessSlug) { toast.error("This kiosk needs a completed online setup before saving photos."); return; }
    continuingRef.current = true;
    setSaving(true);
    try {
      await persistReceipt();
      const shareResult = await syncSessionNow(sessionId).catch(async () => { await processSyncQueue(); return null; });
      setShareResult(shareResult);
      if (!shareResult) toast.info("Saved locally. Online sharing will appear after sync.");
      completeSession();
      await flushBoothSessionPersistence();
      router.push(`${base}/booth/photo-qr${base ? "" : `?template=${encodeURIComponent(normalizedTemplate.id)}`}`);
    } catch {
      continuingRef.current = false;
      toast.error("The receipt could not be saved on this device.");
      setSaving(false);
    }
  }

  return <>
    <div className="mx-auto grid w-full max-w-3xl flex-1 items-center gap-6 pb-4">
      <div className="flex justify-center bg-black/10 p-4 sm:p-7"><ReceiptPreview template={normalizedTemplate} photos={photos} branding={branding} mirrored={mirrored} printable className="max-h-[58dvh] w-auto max-w-full print:max-h-none" /></div>
      <fieldset disabled={sharing || saving} className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center rounded-full bg-white px-4 py-2 text-black"><Button type="button" variant="ghost" size="icon" aria-label="Decrease copies" disabled={copies === 1} onClick={() => setCopies((value) => Math.max(1, value - 1))} className="justify-self-start rounded-full"><Minus /></Button><div className="text-center"><p className="text-xs font-black uppercase tracking-wider">Copies</p><p className="text-2xl font-black">{copies}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Increase copies" disabled={copies === 9} onClick={() => setCopies((value) => Math.min(9, value + 1))} className="justify-self-end rounded-full"><Plus /></Button></div>
        <div className="grid grid-cols-2 gap-3"><Button onClick={() => void retakePhotos()} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><RotateCcw /> Retake</Button><Button type="button" onClick={toggleMirror} aria-pressed={mirrored} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><FlipHorizontal2 /> {mirrored ? "Mirrored" : "Mirror"}</Button></div>
      </fieldset>
      <Button onClick={() => void openPrint()} disabled={renderError || rendering || saving || sharing || !generatedImages} className="h-16 rounded-full bg-black text-xl font-black uppercase text-white hover:bg-black/80">{rendering || saving || sharing ? <LoaderCircle className="animate-spin" /> : <Printer />} {renderError ? "Receipt unavailable" : rendering ? "Preparing receipt" : saving ? "Processing receipt" : sharing ? "Opening Easy Thermal" : "Print"}</Button>
      <p className="text-center text-sm" role="status">Tap Print, then choose Easy Thermal Print and print {copies} {copies === 1 ? "copy" : "copies"}.</p>
    </div>

  </>;
}
