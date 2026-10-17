"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { normalizeReceiptTemplate, templateSupportsPhotoSlots } from "@/lib/receipt/template-rules";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";
import type { PhotoSlotCount } from "@/types";

const PAGE_SIZE = 4;

export function DesignPicker() {
  const pathname = usePathname();
  const router = useBoothRouter();
  const selectedPhotoSlots = useBoothStore((state) => state.selectedPhotoSlots);
  const selectedTemplateId = useBoothStore((state) => state.selectedTemplateId);
  const photos = useBoothStore((state) => state.capturedPhotos);
  const selectDesign = useBoothStore((state) => state.selectDesign);
  const branding = useBusinessStore((state) => state.branding);
  const templates = useBusinessStore((state) => state.templates).map(normalizeReceiptTemplate);
  const legacyTemplate = templates.find((template) => template.id === selectedTemplateId);
  const legacyPhotoSlots = legacyTemplate && [1, 2, 3, 4].includes(legacyTemplate.photoSlots) ? legacyTemplate.photoSlots as PhotoSlotCount : null;
  const activePhotoSlots = selectedPhotoSlots ?? legacyPhotoSlots;
  const compatible = activePhotoSlots ? templates.filter((template) => templateSupportsPhotoSlots(template, activePhotoSlots)) : [];
  const [page, setPage] = React.useState(0);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const pageCount = Math.max(1, Math.ceil(compatible.length / PAGE_SIZE));
  const visible = compatible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function chooseDesign(templateId: string) {
    if (openingId) return;
    setOpeningId(templateId);
    selectDesign(templateId);
    await flushBoothSessionPersistence();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/preview${base ? "" : `?template=${encodeURIComponent(templateId)}`}`);
  }

  if (!activePhotoSlots || !compatible.length) return <p role="alert" className="border border-current p-5">No compatible receipt designs are available for these photos.</p>;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-[clamp(0.55rem,1.4dvh,1rem)]">
        {visible.map((template) => (
          <button key={template.id} type="button" disabled={openingId !== null} onClick={() => void chooseDesign(template.id)} className="relative flex min-h-0 flex-col items-center border-2 border-white/55 bg-white/8 p-[clamp(0.45rem,1.2dvh,0.9rem)] transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] disabled:cursor-wait disabled:opacity-70" aria-label={`Use ${template.name} receipt design`}>
            {openingId === template.id ? <span className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-[var(--booth-primary)]"><LoaderCircle className="size-4 animate-spin" /></span> : null}
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <ReceiptPreview template={template} photoSlots={activePhotoSlots} photos={photos} branding={branding} mirrored compact className="h-full w-auto max-w-full shadow-none" />
            </div>
            <p className="w-full shrink-0 pt-1 text-left text-[clamp(0.7rem,1.45dvh,0.95rem)] font-black uppercase">{template.name}</p>
          </button>
        ))}
      </div>
      {pageCount > 1 ? <nav aria-label="Receipt design pages" className="flex h-11 shrink-0 items-center justify-center gap-4">
        <Button type="button" variant="outline" size="icon" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Previous designs" className="size-11 shrink-0 border-2 border-black bg-white text-black shadow-[3px_3px_0_#101010] hover:bg-[var(--booth-accent)] hover:text-black disabled:border-white/60 disabled:bg-white/20 disabled:text-white/60 disabled:opacity-100 disabled:shadow-none"><ChevronLeft className="size-6" strokeWidth={3} /></Button>
        <span className="text-xs font-bold uppercase tracking-[0.14em]">{page + 1} / {pageCount}</span>
        <Button type="button" variant="outline" size="icon" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} aria-label="Next designs" className="size-11 shrink-0 border-2 border-black bg-white text-black shadow-[3px_3px_0_#101010] hover:bg-[var(--booth-accent)] hover:text-black disabled:border-white/60 disabled:bg-white/20 disabled:text-white/60 disabled:opacity-100 disabled:shadow-none"><ChevronRight className="size-6" strokeWidth={3} /></Button>
      </nav> : null}
    </div>
  );
}
