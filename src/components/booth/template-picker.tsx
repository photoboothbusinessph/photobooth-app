"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";
import { receiptSizeForSlots, templateSupportsPhotoSlots } from "@/lib/receipt/template-rules";
import type { PhotoSlotCount } from "@/types";

const choices: PhotoSlotCount[] = [1, 2, 3, 4];

export function TemplatePicker() {
  const router = useBoothRouter();
  const pathname = usePathname();
  const selectPhotoSlots = useBoothStore((state) => state.selectPhotoSlots);
  const beginCapture = useBoothStore((state) => state.beginCapture);
  const templates = useBusinessStore((state) => state.templates);
  const available = choices.filter((slots) => templates.some((template) => templateSupportsPhotoSlots(template, slots)));
  const [opening, setOpening] = React.useState<PhotoSlotCount | null>(null);

  async function chooseLayout(slots: PhotoSlotCount) {
    if (opening) return;
    setOpening(slots);
    selectPhotoSlots(slots);
    beginCapture();
    await flushBoothSessionPersistence();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/camera${base ? "" : `?slots=${slots}`}`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!available.length ? <p role="alert" className="border border-current p-5">No photo layouts are available. Connect to the internet and ask the administrator to configure a template.</p> : null}
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-[clamp(0.6rem,1.6dvh,1.25rem)]">
        {available.map((slots) => (
          <button key={slots} type="button" disabled={opening !== null} onClick={() => void chooseLayout(slots)} aria-label={`Choose ${slots} shot${slots === 1 ? "" : "s"} and open the camera`} className="group relative grid min-h-0 grid-rows-[minmax(0,1fr)_auto] border-2 border-white/55 bg-white/8 p-[clamp(0.65rem,1.7dvh,1.25rem)] text-left transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] disabled:cursor-wait disabled:opacity-70">
            {opening === slots ? <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[var(--booth-primary)]"><LoaderCircle className="size-4 animate-spin" /></span> : null}
            <div className="mx-auto grid h-full min-h-0 w-[min(72%,13rem)] gap-1 border-2 border-black bg-white p-[clamp(0.5rem,1.2dvh,0.8rem)] shadow-[5px_5px_0_#101010]" style={{ gridTemplateRows: `repeat(${slots}, minmax(0, 1fr))` }} aria-hidden>
              {Array.from({ length: slots }, (_, index) => <span key={index} className="min-h-0 bg-[var(--booth-primary)]" />)}
            </div>
            <div className="pt-[clamp(0.45rem,1dvh,0.8rem)]">
              <p className="text-[clamp(0.9rem,2dvh,1.2rem)] font-black uppercase">{slots} shot{slots === 1 ? "" : "s"}</p>
              <p className="text-[clamp(0.6rem,1.2dvh,0.75rem)] font-bold uppercase tracking-[0.12em] text-white/65">Stacked layout / {receiptSizeForSlots(slots)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
