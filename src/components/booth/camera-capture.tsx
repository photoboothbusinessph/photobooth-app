"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath } from "@/lib/booth-path";
import { CameraOff, RefreshCcw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/shared/status-state";
import { cn } from "@/lib/utils";
import { flushBoothSessionPersistence, useBoothStore } from "@/stores/booth-store";

type CameraState = "requesting" | "ready" | "denied" | "missing" | "error";

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function captureVideoFrame(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) return null;
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function CameraCapture({ photoCount }: { photoCount: number }) {
  const router = useBoothRouter();
  const pathname = usePathname();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const cameraRequestRef = React.useRef(0);
  const [cameraState, setCameraState] = React.useState<CameraState>("requesting");
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const capturedPhotos = useBoothStore((state) => state.capturedPhotos);
  const addCapturedPhoto = useBoothStore((state) => state.addCapturedPhoto);
  const removeCapturedPhoto = useBoothStore((state) => state.removeCapturedPhoto);
  const beginReview = useBoothStore((state) => state.beginReview);
  const captured = capturedPhotos.length;

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = React.useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("missing");
      return;
    }

    setCameraState("requesting");
    stopCamera();
    const requestId = cameraRequestRef.current + 1;
    cameraRequestRef.current = requestId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
    } catch (error) {
      if (cameraRequestRef.current !== requestId) return;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") setCameraState("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setCameraState("missing");
      else setCameraState("error");
    }
  }, [stopCamera]);

  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void startCamera(); });
    return () => {
      active = false;
      cameraRequestRef.current += 1;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  async function capture() {
    if (countdown !== null || captured >= photoCount || cameraState !== "ready") return;
    for (let value = 3; value >= 1; value -= 1) {
      setCountdown(value);
      await wait(1000);
    }
    const image = videoRef.current ? captureVideoFrame(videoRef.current) : null;
    setCountdown(null);
    if (!image) {
      toast.error("The camera frame was not ready. Please try again.");
      return;
    }
    addCapturedPhoto(image);
    if (captured + 1 >= photoCount) {
      toast.success("All frames captured");
      await wait(1000);
      await reviewShots();
      return;
    }
    toast.success("Frame captured");
  }

  async function reviewShots() {
    beginReview();
    await flushBoothSessionPersistence();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/designs`);
  }

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-[clamp(0.45rem,1dvh,0.75rem)]">
      <div className="relative mx-auto h-full min-h-0 w-full max-w-4xl overflow-hidden border-2 border-white bg-black">
        <video ref={videoRef} autoPlay playsInline muted aria-label="Mirrored live camera preview" className={cn("absolute inset-0 size-full -scale-x-100 object-cover", cameraState !== "ready" && "invisible")} />
        {cameraState === "ready" ? (
          <>
            <div className="pointer-events-none absolute inset-0 border-[12px] border-black/15" />
            {countdown ? <div className="absolute inset-0 grid place-items-center bg-black/45" aria-live="assertive"><span className="text-[10rem] font-black leading-none text-white drop-shadow-xl">{countdown}</span></div> : null}
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto_1fr] items-center bg-gradient-to-t from-black/90 to-transparent p-[clamp(0.75rem,2dvh,1.25rem)] pt-[clamp(2.5rem,6dvh,4rem)]">
              <span aria-hidden />
              <button type="button" onClick={() => void capture()} disabled={countdown !== null || captured >= photoCount} aria-label="Capture photo" className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/25 outline-none transition-transform active:scale-95 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)]"><span className="size-14 rounded-full bg-white" /></button>
              <Button variant="outline" size="icon" className="size-14 justify-self-end rounded-full border-white bg-black/30 text-white hover:bg-white hover:text-black" onClick={() => removeCapturedPhoto(captured - 1)} disabled={captured === 0 || countdown !== null} aria-label="Retake last photo"><RotateCcw className="size-6" /></Button>
            </div>
          </>
        ) : cameraState === "requesting" ? (
          <StatusState type="loading" title="Starting camera" description="Approve the browser prompt to begin your photo session." className="h-full border-0 bg-black text-white" />
        ) : cameraState === "denied" ? (
          <StatusState type="camera" title="Camera access blocked" description="Allow camera access in your browser settings, then try again." className="h-full border-0 bg-black text-white" action={<Button onClick={() => void startCamera()} className="h-12"><CameraOff /> Request access</Button>} />
        ) : cameraState === "missing" ? (
          <StatusState type="camera" title="No camera found" description="Connect a camera or open this booth on a device with a camera." className="h-full border-0 bg-black text-white" action={<Button onClick={() => void startCamera()} variant="outline" className="h-12 border-white bg-transparent text-white"><RefreshCcw /> Check again</Button>} />
        ) : (
          <StatusState type="error" title="Camera unavailable" description="The camera could not start. Close other camera apps and try again." className="h-full border-0 bg-black text-white" action={<Button onClick={() => void startCamera()} variant="outline" className="h-12 border-white bg-transparent text-white"><RefreshCcw /> Try again</Button>} />
        )}
      </div>
      <aside className="mx-auto w-full max-w-4xl shrink-0 border-2 border-white/45 bg-black/15 p-[clamp(0.5rem,1dvh,0.75rem)]">
        <div className="flex items-baseline justify-between"><p className="text-xs font-bold uppercase tracking-[0.18em]">Progress</p><strong className="text-2xl">{captured}/{photoCount}</strong></div>
        <div className="my-1.5 h-2 shrink-0 overflow-hidden bg-white/20"><div className="h-full bg-[var(--booth-accent)] transition-all" style={{ width: `${(captured / photoCount) * 100}%` }} /></div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: photoCount }, (_, index) => <div key={index} className={cn("relative h-[clamp(2.5rem,6dvh,4.5rem)] overflow-hidden border", capturedPhotos[index] ? "border-white" : "border-white/20 bg-black/20")}>
            {capturedPhotos[index] ? <Image src={capturedPhotos[index].dataUrl} alt={`Captured frame ${index + 1}`} fill sizes="120px" unoptimized className="-scale-x-100 object-cover" /> : <span className="grid h-full place-items-center text-xs text-white/35">0{index + 1}</span>}
          </div>)}
        </div>
      </aside>
    </div>
  );
}
