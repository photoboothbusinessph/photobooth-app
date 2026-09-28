"use client";

import * as React from "react";
import Link from "next/link";
import { AtSign, Download } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";
import { business, templates } from "@/config/mock-data";
import { cn } from "@/lib/utils";

export function PublicShare({ token }: { token: string }) {
  const [mode, setMode] = React.useState<"color" | "bw">("color");
  if (token === "expired" || token === "invalid") {
    return (
      <main className="grid min-h-dvh place-items-center bg-neutral-950 p-5 text-white">
        <StatusState type="error" title="This photo link has expired" description="Ask the booth host for help or start a new session at the event." className="w-full max-w-lg border-white/20 bg-white/5 text-white" action={<Button nativeButton={false} render={<Link href="/" />} className="h-12">Return to booth</Button>} />
      </main>
    );
  }
  return (
    <main className="min-h-dvh bg-neutral-950 text-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-white/20 px-5 py-5"><BrandMark inverse /><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Private photo / 24h</span></header>
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-[minmax(280px,0.8fr)_1fr] md:py-16">
        <div className="flex justify-center"><ReceiptPreview template={templates[3]} monochrome={mode === "bw"} className="max-w-[380px]" /></div>
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--booth-accent)]">Your JJ NJJ receipt</p>
          <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.065em] sm:text-6xl">Keep the night.</h1>
          <p className="mt-4 text-sm leading-6 text-white/65">Session JJ-0928-1842 · Created just now</p>
          <div className="mt-7 grid grid-cols-2 border border-white/40 p-1">
            {(["color", "bw"] as const).map((value) => <button key={value} onClick={() => setMode(value)} aria-pressed={mode === value} className={cn("min-h-12 font-black uppercase", mode === value ? "bg-white text-black" : "hover:bg-white/10")}>{value === "color" ? "Color" : "B&W"}</button>)}
          </div>
          <Button onClick={() => toast.success(`${mode === "color" ? "Color" : "B&W"} download prepared in demo mode`)} className="mt-4 h-14 w-full rounded-none bg-[var(--booth-primary)] font-black uppercase"><Download /> Download photo</Button>
          <div className="mt-8 border-t border-white/20 pt-6"><p className="text-sm text-white/60">Made a memory?</p><a href="#social" onClick={(event) => { event.preventDefault(); toast(`${business.handle} copied`); }} className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold hover:text-[var(--booth-accent)]"><AtSign className="size-5" /> Follow {business.handle}</a></div>
        </section>
      </div>
    </main>
  );
}
