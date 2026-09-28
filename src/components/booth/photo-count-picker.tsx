"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PhotoCountPicker() {
  const [count, setCount] = React.useState(4);
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {[1, 2, 3, 4].map((value) => {
          const active = count === value;
          return (
            <button type="button" key={value} aria-pressed={active} onClick={() => setCount(value)} className={cn("relative flex aspect-square min-h-40 flex-col items-center justify-center border-2 text-center transition-all focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)]", active ? "border-black bg-white text-black shadow-[8px_8px_0_#101010]" : "border-white/55 bg-white/8 hover:bg-white/15")}>
              {active ? <Check className="absolute right-4 top-4 size-6" /> : null}
              <span className="text-7xl font-black tracking-[-0.08em] sm:text-8xl">{value}</span>
              <span className="mt-2 text-xs font-bold uppercase tracking-[0.18em]">Photo{value > 1 ? "s" : ""}</span>
            </button>
          );
        })}
      </div>
      <div className="safe-bottom mt-10 flex justify-end">
        <Button nativeButton={false} render={<Link href="/booth/camera" />} className="h-14 w-full rounded-none border-2 border-black bg-[var(--booth-accent)] px-7 text-base font-black uppercase text-black hover:bg-white sm:w-auto">Open camera <ArrowRight className="size-5" /></Button>
      </div>
    </div>
  );
}
