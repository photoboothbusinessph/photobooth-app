"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";
import { ArrowRight, Check } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

export function TemplatePicker({ initialSelected = "double" }: { initialSelected?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const storedTemplateId = useBoothStore((state) => state.selectedTemplateId);
  const selectTemplate = useBoothStore((state) => state.selectTemplate);
  const beginCapture = useBoothStore((state) => state.beginCapture);
  const templates = useBusinessStore((state) => state.templates);
  const fallbackId = templates.find((template) => template.isDefault)?.id ?? templates[0]?.id ?? "";
  const [selected, setSelected] = React.useState(() => storedTemplateId ?? (templates.some((template) => template.id === initialSelected) ? initialSelected : fallbackId));
  const resolvedSelected = templates.some((template) => template.id === selected) ? selected : fallbackId;

  function chooseTemplate(templateId: string) {
    setSelected(templateId);
    selectTemplate(templateId);
  }

  function continueToCamera() {
    if (!resolvedSelected) return;
    selectTemplate(resolvedSelected);
    beginCapture();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(resolvedSelected)}`}`);
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {templates.map((template) => {
          const active = resolvedSelected === template.id;
          return (
            <button key={template.id} type="button" aria-pressed={active} onClick={() => chooseTemplate(template.id)} className={cn("group relative flex min-h-80 flex-col items-center border-2 p-4 text-left transition-all focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] sm:p-6", active ? "border-black bg-white text-black shadow-[8px_8px_0_#101010]" : "border-white/55 bg-white/8 hover:bg-white/15")}>
              {active ? <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-[var(--booth-primary)] text-white"><Check className="size-4" /></span> : null}
              <ReceiptPreview template={template} compact className="w-[78%] shadow-none" />
              <div className="mt-5 w-full">
                <p className="text-base font-black uppercase tracking-[-0.03em]">{template.name}</p>
                <p className={cn("mt-1 text-xs font-bold uppercase tracking-[0.12em]", active ? "text-black/55" : "text-white/65")}>{template.photoSlots} photo{template.photoSlots > 1 ? "s" : ""} / {template.size}</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="safe-bottom mt-8 flex justify-end">
        <Button onClick={continueToCamera} disabled={!resolvedSelected} className="h-14 w-full rounded-none border-2 border-black bg-[var(--booth-accent)] px-7 text-base font-black uppercase text-black hover:bg-white sm:w-auto">Continue <ArrowRight className="size-5" /></Button>
      </div>
    </div>
  );
}
