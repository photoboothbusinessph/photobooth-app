"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { FlipHorizontal2, LoaderCircle, Minus, Plus, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { saveLocalSession } from "@/lib/db/indexed-db";
import { normalizeReceiptTemplate, receiptMillimeters } from "@/lib/receipt/template-rules";
import { renderReceiptImage } from "@/lib/receipt/render-receipt";
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
  const [printOpen, setPrintOpen] = React.useState(false);
  const [mirrored, setMirrored] = React.useState(false);
  const [copies, setCopies] = React.useState(1);
  const printFinishedRef = React.useRef(false);
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
    ]).then(([color, bw]) => { if (!cancelled) setGeneratedImages({ color, bw }); })
      .catch(() => { if (!cancelled) toast.error("The final receipt image could not be generated."); })
      .finally(() => { if (!cancelled) setRendering(false); });
    return () => { cancelled = true; };
  }, [branding, mirrored, normalizedTemplate, photos, setGeneratedImages]);

  async function retakePhotos() {
    beginCapture();
    await flushBoothSessionPersistence();
    router.push(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(normalizedTemplate.id)}`}`);
  }

  function toggleMirror() {
    setRendering(true);
    setMirrored((value) => !value);
  }

  async function saveAndContinue() {
    if (!sessionId || !generatedImages || saving) return;
    const businessSlug = boothSlug(pathname);
    if (!businessId || !businessSlug) { toast.error("This kiosk needs a completed online setup before saving photos."); return; }
    setSaving(true);
    try {
      await saveLocalSession({ id: sessionId, businessId, businessSlug, templateId: normalizedTemplate.id, photos, colorImage: generatedImages.color, bwImage: generatedImages.bw });
      const shareResult = await syncSessionNow(sessionId).catch(async () => { await processSyncQueue(); return null; });
      setShareResult(shareResult);
      if (!shareResult) toast.info("Saved locally. Online sharing will appear after sync.");
      completeSession();
      await flushBoothSessionPersistence();
      router.push(`${base}/booth/photo-qr${base ? "" : `?template=${encodeURIComponent(normalizedTemplate.id)}`}`);
    } catch {
      toast.error("The receipt could not be saved on this device.");
      setSaving(false);
    }
  }

  function finishPrint() {
    if (printFinishedRef.current) return;
    printFinishedRef.current = true;
    sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
    sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
    window.speechSynthesis?.cancel();
    setPrintOpen(false);
    toast.success("Print dialog closed. Preparing your QR code.");
    void saveAndContinue();
  }

  function printReceipt() {
    printFinishedRef.current = false;
    const dimensions = receiptMillimeters(normalizedTemplate.size);
    const printStyle = document.createElement("style");
    printStyle.dataset.receiptPrintStyle = "true";
    printStyle.textContent = `@media print{@page{size:${dimensions.width}mm ${dimensions.height}mm;margin:0}[data-print-receipt=true]{width:${dimensions.width}mm!important;height:${dimensions.height}mm!important}}`;
    document.head.append(printStyle);
    const handleAfterPrint = () => {
      printStyle.remove();
      finishPrint();
    };
    window.addEventListener("afterprint", handleAfterPrint, { once: true });
    toast.info(`Select ${copies} ${copies === 1 ? "copy" : "copies"} in the tablet print dialog.`);
    window.print();
    window.setTimeout(() => {
      window.removeEventListener("afterprint", handleAfterPrint);
      printStyle.remove();
      finishPrint();
    }, 1500);
  }

  return <>
    <div className="mx-auto grid w-full max-w-3xl flex-1 items-center gap-6 pb-4">
      <div className="flex justify-center bg-black/10 p-4 sm:p-7"><ReceiptPreview template={normalizedTemplate} photos={photos} branding={branding} mirrored={mirrored} className="max-h-[58dvh] w-auto max-w-full" /></div>
      <div className="grid gap-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center rounded-full bg-white px-4 py-2 text-black"><Button type="button" variant="ghost" size="icon" aria-label="Decrease copies" disabled={copies === 1} onClick={() => setCopies((value) => Math.max(1, value - 1))} className="justify-self-start rounded-full"><Minus /></Button><div className="text-center"><p className="text-xs font-black uppercase tracking-wider">Copies</p><p className="text-2xl font-black">{copies}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Increase copies" disabled={copies === 9} onClick={() => setCopies((value) => Math.min(9, value + 1))} className="justify-self-end rounded-full"><Plus /></Button></div>
        <div className="grid grid-cols-2 gap-3"><Button onClick={() => void retakePhotos()} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><RotateCcw /> Retake</Button><Button type="button" onClick={toggleMirror} aria-pressed={mirrored} variant="outline" className="h-14 rounded-full border-0 bg-white font-black uppercase text-black hover:bg-white/85"><FlipHorizontal2 /> {mirrored ? "Mirrored" : "Mirror"}</Button></div>
        <Button onClick={() => setPrintOpen(true)} disabled={rendering || saving || !generatedImages} className="h-16 rounded-full bg-black text-xl font-black uppercase text-white hover:bg-black/80">{rendering || saving ? <LoaderCircle className="animate-spin" /> : <Printer />} {rendering ? "Preparing receipt" : saving ? "Saving receipt" : "Print"}</Button>
      </div>
    </div>

    <Dialog open={printOpen} onOpenChange={(open) => { if (open && !saving) setPrintOpen(true); }}><DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto rounded-none border-2 border-black p-0"><DialogHeader className="border-b border-black/15 p-5"><DialogTitle className="text-2xl font-black uppercase">{normalizedTemplate.size} print preview</DialogTitle><DialogDescription>Confirm the receipt, then select {copies} {copies === 1 ? "copy" : "copies"} in the tablet’s print dialog.</DialogDescription></DialogHeader><div className="flex justify-center bg-neutral-200 p-5"><ReceiptPreview template={normalizedTemplate} photos={photos} branding={branding} mirrored={mirrored} printable className="max-h-[62dvh] w-auto max-w-full" /></div><DialogFooter className="m-0 rounded-none border-black/15 bg-white p-5"><Button onClick={printReceipt} className="h-14 w-full rounded-none bg-black font-black uppercase text-white hover:bg-[var(--booth-primary)]"><Printer /> Print on {normalizedTemplate.size}</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
