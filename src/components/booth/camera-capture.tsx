"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";
import { ArrowRight, CameraOff, RefreshCcw, RotateCcw, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusState } from "@/components/shared/status-state";
import { cn } from "@/lib/utils";
import { useBoothStore } from "@/stores/booth-store";

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

export function CameraCapture({ photoCount, templateId, templateName }: { photoCount: number; templateId: string; templateName: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const cameraRequestRef = React.useRef(0);
  const [cameraState, setCameraState] = React.useState<CameraState>("requesting");
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = React.useState<string | null>(null);
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

  const refreshDevices = React.useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const available = await navigator.mediaDevices.enumerateDevices();
    setDevices(available.filter((device) => device.kind === "videoinput"));
  }, []);

  const startCamera = React.useCallback(async (deviceId?: string) => {
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
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (cameraRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      setActiveDeviceId(track.getSettings().deviceId ?? deviceId ?? null);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("ready");
      await refreshDevices();
    } catch (error) {
      if (cameraRequestRef.current !== requestId) return;
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") setCameraState("denied");
      else if (name === "NotFoundError" || name === "OverconstrainedError") setCameraState("missing");
      else setCameraState("error");
    }
  }, [refreshDevices, stopCamera]);

  React.useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void startCamera(); });
    const handleDeviceChange = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener("devicechange", handleDeviceChange);
    return () => {
      active = false;
      cameraRequestRef.current += 1;
      navigator.mediaDevices?.removeEventListener("devicechange", handleDeviceChange);
      stopCamera();
    };
  }, [refreshDevices, startCamera, stopCamera]);

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
    toast.success("Frame captured");
  }

  async function switchCamera() {
    if (devices.length < 2) return;
    const currentIndex = devices.findIndex((device) => device.deviceId === activeDeviceId);
    const nextDevice = devices[(currentIndex + 1 + devices.length) % devices.length];
    await startCamera(nextDevice.deviceId);
    toast.success(`Switched to ${nextDevice.label || "another camera"}`);
  }

  function reviewShots() {
    beginReview();
    const base = boothBasePath(pathname);
    router.push(`${base}/booth/preview${base ? "" : `?template=${encodeURIComponent(templateId)}`}`);
  }

  return (
    <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="relative min-h-[54vh] overflow-hidden border-2 border-white bg-black">
        <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview" className={cn("absolute inset-0 size-full object-cover", cameraState !== "ready" && "invisible")} />
        {cameraState === "ready" ? (
          <>
            <div className="pointer-events-none absolute inset-0 border-[12px] border-black/15" />
            <div className="absolute left-4 top-4 flex items-center gap-2 bg-black/70 px-3 py-2 text-xs font-bold uppercase tracking-[0.15em]"><span className="size-2 animate-pulse rounded-full bg-red-500" /> Live preview</div>
            {countdown ? <div className="absolute inset-0 grid place-items-center bg-black/45" aria-live="assertive"><span className="text-[10rem] font-black leading-none text-white drop-shadow-xl">{countdown}</span></div> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-5 pt-16">
              <Button variant="outline" size="icon" className="size-14 rounded-full border-white bg-black/30 text-white hover:bg-white hover:text-black" onClick={() => void switchCamera()} disabled={devices.length < 2 || countdown !== null} aria-label="Switch camera"><SwitchCamera className="size-6" /></Button>
              <button type="button" onClick={() => void capture()} disabled={countdown !== null || captured >= photoCount} aria-label="Capture photo" className="grid size-20 place-items-center rounded-full border-4 border-white bg-white/25 outline-none transition-transform active:scale-95 disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-[var(--booth-accent)]"><span className="size-14 rounded-full bg-white" /></button>
              <Button variant="outline" size="icon" className="size-14 rounded-full border-white bg-black/30 text-white hover:bg-white hover:text-black" onClick={() => removeCapturedPhoto(captured - 1)} disabled={captured === 0 || countdown !== null} aria-label="Retake last photo"><RotateCcw className="size-6" /></Button>
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
      <aside className="flex flex-col border-2 border-white/45 bg-black/15 p-4">
        <div className="flex items-baseline justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em]">Progress</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/55">{templateName}</p></div><strong className="text-2xl">{captured}/{photoCount}</strong></div>
        <div className="my-4 h-2 overflow-hidden bg-white/20"><div className="h-full bg-[var(--booth-accent)] transition-all" style={{ width: `${(captured / photoCount) * 100}%` }} /></div>
        <div className={cn("grid gap-2", photoCount === 1 ? "grid-cols-1" : "grid-cols-2")}>
          {Array.from({ length: photoCount }, (_, index) => <div key={index} className={cn("relative aspect-square overflow-hidden border", capturedPhotos[index] ? "border-white" : "border-white/20 bg-black/20")}>
            {capturedPhotos[index] ? <Image src={capturedPhotos[index].dataUrl} alt={`Captured frame ${index + 1}`} fill sizes="120px" unoptimized className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-white/35">0{index + 1}</span>}
          </div>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-white/60">Camera access stays on this device. Photos are held only in the current browser session.</p>
        <Button onClick={reviewShots} disabled={captured < photoCount} className="mt-auto h-14 rounded-none bg-[var(--booth-accent)] font-black uppercase text-black hover:bg-white">{captured < photoCount ? `Take ${photoCount - captured} more` : "Review shots"} <ArrowRight /></Button>
      </aside>
    </div>
  );
}
