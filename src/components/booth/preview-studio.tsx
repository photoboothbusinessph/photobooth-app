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
import { createReceiptCopySheet, shareReceiptWithEasyThermal } from "@/lib/receipt/easy-thermal";
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
  const [mirrored, setMirrored] = React.useState(true);
  const [copies, setCopies] = React.useState(1);
  const [preparedPrint, setPreparedPrint] = React.useState<{ source: string; copies: number; image: string } | null>(null);
  const savedImageRef = React.useRef<string | null>(null);
  const dispatchingRef = React.useRef(false);
  const continuingRef = React.useRef(false);
  const [renderError, setRenderError] = React.useState(false);
  const sessionId = useBoothStore((state) => state.sessionId);
  const selectedPhotoSlots = useBoothStore((state) => state.selectedPhotoSlots);
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
      renderReceiptImage({ template: normalizedTemplate, photoSlots: selectedPhotoSlots ?? undefined, photos, branding, palette: normalizedTemplate.palette, monochrome: false, mirrored }),
      renderReceiptImage({ template: normalizedTemplate, photoSlots: selectedPhotoSlots ?? undefined, photos, branding, palette: normalizedTemplate.palette, monochrome: true, mirrored }),
    ]).then(([color, bw]) => {
      if (cancelled) return;
      setGeneratedImages({ color, bw });
    })
      .catch(() => { if (!cancelled) { setRenderError(true); toast.error("The final receipt image could not be generated. Try Mirror again or retake the photos."); } })
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [branding, mirrored, normalizedTemplate, photos, selectedPhotoSlots, setGeneratedImages]);

  React.useEffect(() => () => { setReceiptPrinting(false); }, []);

  React.useEffect(() => {
    let cancelled = false;
    const source = generatedImages?.color;
    if (!source) return;
    createReceiptCopySheet(source, copies)
      .then((image) => { if (!cancelled) setPreparedPrint({ source, copies, image }); })
      .catch(() => { if (!cancelled) { setPreparedPrint(null); toast.error("The selected receipt copies could not be prepared."); } });
    return () => { cancelled = true; };
  }, [copies, generatedImages]);

  const printImage = preparedPrint && preparedPrint.source === generatedImages?.color && preparedPrint.copies === copies ? preparedPrint.image : null;
  const preparingCopies = Boolean(generatedImages?.color && !printImage);

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
    if (dispatchingRef.current || continuingRef.current || rendering || preparingCopies || saving || sharing || !generatedImages || !printImage) return;
    dispatchingRef.current = true;
    setReceiptPrinting(true);
    setSharing(true);
    window.speechSynthesis?.cancel();
    try {
      await shareReceiptWithEasyThermal(printImage, copies);
      toast.info(copies === 1 ? "Receipt shared. Print the image once in Easy Thermal Print." : `Receipt shared with ${copies} copies included. Print the image once in Easy Thermal Print.`);
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
    router.push(`${base}/booth/camera`);
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
    <div className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 grid-rows-[minmax(0,1fr)_auto_auto_auto] items-center gap-[clamp(0.5rem,1.4dvh,1rem)] min-[700px]:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] min-[700px]:grid-rows-[1fr_auto_auto]">
      <div className="flex h-full min-h-0 justify-center bg-black/10 p-[clamp(0.5rem,1.4dvh,1.25rem)] min-[700px]:row-span-3"><ReceiptPreview template={normalizedTemplate} photoSlots={selectedPhotoSlots ?? undefined} photos={photos} branding={branding} mirrored={mirrored} printable className="h-full w-auto max-w-full print:max-h-none" /></div>
      <fieldset disabled={sharing || saving} className="grid gap-3 self-end">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center rounded-full bg-white px-4 py-2 text-black"><Button type="button" variant="ghost" size="icon" aria-label="Decrease copies" disabled={copies === 1} onClick={() => setCopies((value) => Math.max(1, value - 1))} className="justify-self-start rounded-full"><Minus /></Button><div className="text-center"><p className="text-xs font-black uppercase tracking-wider">Copies</p><p className="text-2xl font-black">{copies}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Increase copies" disabled={copies === 9} onClick={() => setCopies((value) => Math.min(9, value + 1))} className="justify-self-end rounded-full"><Plus /></Button></div>
        <div className="grid grid-cols-2 gap-3"><Button onClick={() => void retakePhotos()} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><RotateCcw /> Retake</Button><Button type="button" onClick={toggleMirror} aria-pressed={mirrored} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><FlipHorizontal2 /> {mirrored ? "Mirrored" : "Mirror"}</Button></div>
      </fieldset>
      <Button onClick={() => void openPrint()} disabled={renderError || rendering || preparingCopies || saving || sharing || !generatedImages || !printImage} className="h-16 rounded-full bg-black text-xl font-black uppercase text-white hover:bg-black/80">{rendering || preparingCopies || saving || sharing ? <LoaderCircle className="animate-spin" /> : <Printer />} {renderError ? "Receipt unavailable" : rendering || preparingCopies ? "Preparing copies" : saving ? "Processing receipt" : sharing ? "Opening Easy Thermal" : "Print"}</Button>
      <p className="text-center text-xs sm:text-sm" role="status">Print the shared image once. It contains {copies} complete receipt {copies === 1 ? "copy" : "copies"}.</p>
    </div>

  </>;
}
