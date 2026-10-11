"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, LoaderCircle, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { BOOTH_SESSION_DEADLINE_KEY, BOOTH_SESSION_VOICE_WARNINGS_KEY } from "@/lib/booth-session";
import { saveLocalSession } from "@/lib/db/indexed-db";
import { renderReceiptImage } from "@/lib/receipt/render-receipt";
import { processSyncQueue, syncSessionNow } from "@/lib/sync/client-sync";
import { cn } from "@/lib/utils";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";
import type { ReceiptTemplate } from "@/types";

export function PreviewStudio({ template }: { template: ReceiptTemplate }) {
  const router = useBoothRouter();
  const pathname = usePathname();
  const base = boothBasePath(pathname);
  const [rendering, setRendering] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [printOpen, setPrintOpen] = React.useState(false);
  const [printed, setPrinted] = React.useState(false);
  const printFinishedRef = React.useRef(false);
  const sessionId = useBoothStore((state) => state.sessionId);
  const mode = useBoothStore((state) => state.previewMode);
  const setMode = useBoothStore((state) => state.setPreviewMode);
  const photos = useBoothStore((state) => state.capturedPhotos);
  const generatedImages = useBoothStore((state) => state.generatedImages);
  const setGeneratedImages = useBoothStore((state) => state.setGeneratedImages);
  const beginCapture = useBoothStore((state) => state.beginCapture);
  const completeSession = useBoothStore((state) => state.completeSession);
  const setShareResult = useBoothStore((state) => state.setShareResult);
  const branding = useBusinessStore((state) => state.branding);
  const businessId = useBusinessStore((state) => state.businessId);
  const printTemplate = React.useMemo(() => ({ ...template, size: "80 × 180 mm" }), [template]);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([
      renderReceiptImage({ template, photos, branding, palette: template.palette, monochrome: false }),
      renderReceiptImage({ template, photos, branding, palette: template.palette, monochrome: true }),
    ])
      .then(([color, bw]) => {
        if (!cancelled) setGeneratedImages({ color, bw });
      })
      .catch(() => {
        if (!cancelled) toast.error("The final receipt image could not be generated.");
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branding, photos, setGeneratedImages, template]);

  async function retakePhotos() {
    beginCapture();
    await flushBoothSessionPersistence();
    router.push(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(template.id)}`}`);
  }

  function selectMode(value: "color" | "bw") {
    setMode(value);
    setPrinted(false);
  }

  function finishPrint() {
    if (printFinishedRef.current) return;
    printFinishedRef.current = true;
    sessionStorage.removeItem(BOOTH_SESSION_DEADLINE_KEY);
    sessionStorage.removeItem(BOOTH_SESSION_VOICE_WARNINGS_KEY);
    window.speechSynthesis?.cancel();
    setPrinted(true);
    setPrintOpen(false);
    toast.success("Receipt print step completed.");
  }

  function printReceipt() {
    printFinishedRef.current = false;
    const handleAfterPrint = () => finishPrint();
    window.addEventListener("afterprint", handleAfterPrint, { once: true });
    window.print();
    window.setTimeout(() => {
      window.removeEventListener("afterprint", handleAfterPrint);
      finishPrint();
    }, 300);
  }

  async function continueToQrPage() {
    if (!printed || !sessionId || !generatedImages || saving) return;
    const businessSlug = boothSlug(pathname);
    if (!businessId || !businessSlug) {
      toast.error("This kiosk needs a completed online setup before saving photos.");
      return;
    }
    setSaving(true);
    try {
      await saveLocalSession({
        id: sessionId,
        businessId,
        businessSlug,
        templateId: template.id,
        photos,
        colorImage: generatedImages.color,
        bwImage: generatedImages.bw,
      });
      const shareResult = await syncSessionNow(sessionId).catch(async () => {
        await processSyncQueue();
        return null;
      });
      setShareResult(shareResult);
      if (!shareResult) toast.info("Saved locally. Online sharing will appear after sync.");
    } catch {
      toast.error("The receipt could not be saved on this device.");
      setSaving(false);
      return;
    }
    completeSession();
    await flushBoothSessionPersistence();
    router.push(`${base}/booth/photo-qr${base ? "" : `?template=${encodeURIComponent(template.id)}`}`);
  }

  return (
    <>
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(320px,0.8fr)_minmax(320px,1fr)]">
        <div className="flex justify-center bg-black/10 p-6 sm:p-10">
          <ReceiptPreview template={template} photos={photos} branding={branding} monochrome={mode === "bw"} className="max-w-[360px]" />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Final receipt</p>
          <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">How does it look?</h2>
          <div className="mt-7 grid grid-cols-2 border-2 border-white p-1" aria-label="Photo color mode">
            {(["color", "bw"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => selectMode(value)}
                className={cn("min-h-12 px-4 text-sm font-black uppercase", mode === value ? "bg-white text-black" : "text-white hover:bg-white/10")}
              >
                {value === "color" ? "Color" : "B&W"}
              </button>
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Button onClick={() => void retakePhotos()} variant="outline" className="h-14 rounded-none border-white bg-transparent font-black uppercase text-white hover:bg-white hover:text-black">
              <RotateCcw /> Retake
            </Button>
            <Button onClick={() => setPrintOpen(true)} disabled={rendering || !generatedImages} className="h-14 rounded-none bg-[var(--booth-accent)] font-black uppercase text-black hover:bg-white">
              {rendering ? <LoaderCircle className="animate-spin" /> : <Printer />} {rendering ? "Preparing receipt" : printed ? "Print again" : "Print receipt"}
            </Button>
            {printed ? (
              <Button onClick={() => void continueToQrPage()} disabled={saving} className="h-14 rounded-none bg-[var(--booth-accent)] font-black uppercase text-black hover:bg-white sm:col-span-2">
                {saving ? <LoaderCircle className="animate-spin" /> : null} {saving ? "Saving locally" : "Next page"} {!saving ? <ArrowRight /> : null}
              </Button>
            ) : null}
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-white/65">
            {rendering ? (
              <><LoaderCircle className="size-4 animate-spin" /> Preparing color and black-and-white files…</>
            ) : printed ? (
              "Receipt print step completed. Continue to your QR codes."
            ) : (
              "Choose a version, then preview and print it on 80mm receipt paper."
            )}
          </p>
        </div>
      </div>

      <Dialog open={printOpen} onOpenChange={(open) => { if (open) setPrintOpen(true); }}>
        <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-none border-2 border-black p-0">
          <DialogHeader className="border-b border-black/15 p-5 sm:p-6">
            <DialogTitle className="text-2xl font-black uppercase tracking-[-0.04em]">80mm print preview</DialogTitle>
            <DialogDescription>Check the selected receipt version, then send it to the connected 80mm receipt printer.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center bg-neutral-200 p-5 sm:p-8">
            <ReceiptPreview template={printTemplate} photos={photos} branding={branding} monochrome={mode === "bw"} printable className="max-w-[302px]" />
          </div>
          <DialogFooter className="m-0 rounded-none border-black/15 bg-white p-5 sm:p-6">
            <Button onClick={printReceipt} className="h-14 w-full rounded-none bg-black font-black uppercase text-white hover:bg-[var(--booth-primary)] sm:w-auto">
              <Printer /> Print on 80mm paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
