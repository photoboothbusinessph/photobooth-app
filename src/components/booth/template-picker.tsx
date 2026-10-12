"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { LoaderCircle } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";
import { normalizeReceiptTemplate } from "@/lib/receipt/template-rules";

export function TemplatePicker() {
  const router = useBoothRouter();
  const pathname = usePathname();
  const selectTemplate = useBoothStore((state) => state.selectTemplate);
  const beginCapture = useBoothStore((state) => state.beginCapture);
  const templates = useBusinessStore((state) => state.templates).map(normalizeReceiptTemplate);
  const [openingTemplateId, setOpeningTemplateId] = React.useState<string | null>(null);

  async function chooseTemplate(templateId: string) {
    if (openingTemplateId) return;
    setOpeningTemplateId(templateId);
    selectTemplate(templateId);
    beginCapture();
    await flushBoothSessionPersistence();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(templateId)}`}`);
  }
  return (
    <div className="flex flex-1 flex-col">
      {!templates.length ? <p role="alert" className="border border-current p-5">No receipt layouts are saved for this business. Connect to the internet and ask the administrator to configure a layout.</p> : null}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {templates.map((template) => (
          <button key={template.id} type="button" aria-label={`Choose ${template.name} and continue to camera`} disabled={Boolean(openingTemplateId)} onClick={() => void chooseTemplate(template.id)} className="group relative flex min-h-80 flex-col items-center border-2 border-white/55 bg-white/8 p-4 text-left transition-all hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] disabled:cursor-wait disabled:opacity-70 sm:p-6">
            {openingTemplateId === template.id ? <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[var(--booth-primary)] text-white"><LoaderCircle className="size-4 animate-spin" /></span> : null}
            <div className="flex min-h-0 w-full flex-1 items-center justify-center py-2">
              <ReceiptPreview template={template} compact className="w-[78%] shadow-none" />
            </div>
            <div className="mt-5 w-full shrink-0">
              <p className="text-base font-black uppercase tracking-[-0.03em]">{template.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/65">{template.photoSlots} photo{template.photoSlots > 1 ? "s" : ""} / {template.size}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
