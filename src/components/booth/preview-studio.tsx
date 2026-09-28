"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Printer, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Button } from "@/components/ui/button";
import { templates } from "@/config/mock-data";
import { cn } from "@/lib/utils";

export function PreviewStudio() {
  const [mode, setMode] = React.useState<"color" | "bw">("color");
  return (
    <div className="grid flex-1 items-center gap-8 lg:grid-cols-[minmax(320px,0.8fr)_minmax(320px,1fr)]">
      <div className="flex justify-center bg-black/10 p-6 sm:p-10"><ReceiptPreview template={templates[3]} monochrome={mode === "bw"} className="max-w-[360px]" /></div>
      <div className="flex flex-col justify-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Final receipt</p>
        <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.055em] sm:text-5xl">How does it look?</h2>
        <div className="mt-7 grid grid-cols-2 border-2 border-white p-1" aria-label="Photo color mode">
          {(["color", "bw"] as const).map((value) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={cn("min-h-12 px-4 text-sm font-black uppercase", mode === value ? "bg-white text-black" : "text-white hover:bg-white/10")}>{value === "color" ? "Color" : "B&W"}</button>)}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button nativeButton={false} render={<Link href="/booth/camera" />} variant="outline" className="h-14 rounded-none border-white bg-transparent font-black uppercase text-white hover:bg-white hover:text-black"><RotateCcw /> Retake</Button>
          <Button onClick={() => toast.success("Print preview ready in demo mode")} variant="outline" className="h-14 rounded-none border-white bg-transparent font-black uppercase text-white hover:bg-white hover:text-black"><Printer /> Print</Button>
          <Button nativeButton={false} render={<Link href="/booth/photo-qr" />} className="h-14 rounded-none bg-[var(--booth-accent)] font-black uppercase text-black hover:bg-white sm:col-span-2"><Check /> Confirm receipt <ArrowRight /></Button>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/60">Print and image processing are represented as UI-only actions in this phase.</p>
      </div>
    </div>
  );
}
