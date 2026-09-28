"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CameraOff, CircleAlert, RefreshCcw, RotateCcw, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/shared/status-state";
import { cn } from "@/lib/utils";

type CameraState = "ready" | "permission" | "error";

export function CameraMock() {
  const [cameraState, setCameraState] = React.useState<CameraState>("ready");
  const [captured, setCaptured] = React.useState(2);
  const [countdown, setCountdown] = React.useState<number | null>(null);

  function capture() {
    setCountdown(3);
    window.setTimeout(() => setCountdown(2), 450);
    window.setTimeout(() => setCountdown(1), 900);
    window.setTimeout(() => {
      setCountdown(null);
      setCaptured((value) => Math.min(4, value + 1));
      toast.success("Frame captured");
    }, 1350);
  }

  return (
    <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="relative min-h-[54vh] overflow-hidden border-2 border-white bg-black">
        {cameraState === "ready" ? (
          <>
            <Image src="/images/booth-friends-02.png" alt="Synthetic camera preview of three friends" fill priority sizes="(max-width: 1024px) 100vw, 75vw" className="object-cover" />
            <div className="absolute inset-0 border-[12px] border-black/15" />
            <div className="absolute left-4 top-4 flex items-center gap-2 bg-black/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em]"><span className="size-2 animate-pulse rounded-full bg-red-500" /> Live preview</div>
            {countdown ? <div className="absolute inset-0 grid place-items-center bg-black/40" aria-live="assertive"><span className="text-[10rem] font-black leading-none text-white drop-shadow-xl">{countdown}</span></div> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
              <Button variant="outline" size="icon" className="size-14 rounded-full border-white bg-black/30 text-white hover:bg-white hover:text-black" onClick={() => toast("Camera switched in demo mode")} aria-label="Switch camera"><SwitchCamera className="size-6" /></Button>
              <button type="button" onClick={capture} disabled={countdown !== null || captured === 4} aria-label="Capture photo" className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/25 outline-none transition-transform active:scale-95 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)]"><span className="size-14 rounded-full bg-white" /></button>
              <Button variant="outline" size="icon" className="size-14 rounded-full border-white bg-black/30 text-white hover:bg-white hover:text-black" onClick={() => setCaptured((value) => Math.max(0, value - 1))} disabled={captured === 0} aria-label="Retake last photo"><RotateCcw className="size-6" /></Button>
            </div>
          </>
        ) : cameraState === "permission" ? (
          <StatusState type="camera" title="Camera access needed" description="Allow camera access in your browser to start the live preview." className="h-full border-0 bg-black text-white" action={<Button onClick={() => setCameraState("ready")} className="h-12">Allow camera (demo)</Button>} />
        ) : (
          <StatusState type="error" title="Camera unavailable" description="No camera was found. Check the connection or choose another device." className="h-full border-0 bg-black text-white" action={<Button onClick={() => setCameraState("ready")} variant="outline" className="h-12 border-white bg-transparent text-white"><RefreshCcw /> Try again</Button>} />
        )}
      </div>
      <aside className="flex flex-col border-2 border-white/45 bg-black/15 p-4">
        <div className="flex items-baseline justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em]">Progress</p><strong className="text-2xl">{captured}/4</strong></div>
        <div className="my-4 h-2 overflow-hidden bg-white/20"><div className="h-full bg-[var(--booth-accent)] transition-all" style={{ width: `${captured * 25}%` }} /></div>
        <div className="grid grid-cols-4 gap-2 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className={cn("relative aspect-square overflow-hidden border", index < captured ? "border-white" : "border-white/20 bg-black/20")}>
            {index < captured ? <Image src={index % 2 ? "/images/booth-friends-01.png" : "/images/booth-friends-02.png"} alt={`Captured frame ${index + 1}`} fill sizes="120px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-white/35">0{index + 1}</span>}
          </div>)}
        </div>
        <div className="mt-5 grid gap-2 text-left">
          <button type="button" onClick={() => setCameraState("permission")} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70 hover:text-white"><CameraOff className="size-4" /> Permission state</button>
          <button type="button" onClick={() => setCameraState("error")} className="inline-flex min-h-10 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/70 hover:text-white"><CircleAlert className="size-4" /> Error state</button>
        </div>
        <Button nativeButton={false} render={<Link href="/booth/preview" />} disabled={captured === 0} className="mt-auto h-14 rounded-none bg-[var(--booth-accent)] font-black uppercase text-black hover:bg-white">Review shots <ArrowRight /></Button>
      </aside>
    </div>
  );
}
