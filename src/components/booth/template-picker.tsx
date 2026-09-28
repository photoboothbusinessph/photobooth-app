"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { templates } from "@/config/mock-data";
import { cn } from "@/lib/utils";

export function TemplatePicker() {
  const [selected, setSelected] = React.useState("double");
  return (
    <div className="flex flex-1 flex-col">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {templates.map((template) => {
          const active = selected === template.id;
          return (
            <button key={template.id} type="button" aria-pressed={active} onClick={() => setSelected(template.id)} className={cn("group relative flex min-h-80 flex-col items-center border-2 p-4 text-left transition-all focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)] sm:p-6", active ? "border-black bg-white text-black shadow-[8px_8px_0_#101010]" : "border-white/55 bg-white/8 hover:bg-white/15")}>
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
        <Button nativeButton={false} render={<Link href="/booth/photo-count" />} className="h-14 w-full rounded-none border-2 border-black bg-[var(--booth-accent)] px-7 text-base font-black uppercase text-black hover:bg-white sm:w-auto">Continue <ArrowRight className="size-5" /></Button>
      </div>
    </div>
  );
}
