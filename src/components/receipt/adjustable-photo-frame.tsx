"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_PHOTO_ADJUSTMENT, getCoverPlacement, MAX_PHOTO_ZOOM, MIN_PHOTO_ZOOM } from "@/lib/receipt/photo-adjustment";
import type { PhotoAdjustment } from "@/types";

type PointerPosition = { x: number; y: number };
type Gesture = {
  adjustment: PhotoAdjustment;
  pointers: Map<number, PointerPosition>;
  center: PointerPosition;
  distance: number;
};

function pointerCenter(pointers: PointerPosition[]) {
  if (pointers.length === 1) return pointers[0];
  return { x: (pointers[0].x + pointers[1].x) / 2, y: (pointers[0].y + pointers[1].y) / 2 };
}

function pointerDistance(pointers: PointerPosition[]) {
  if (pointers.length < 2) return 0;
  return Math.hypot(pointers[1].x - pointers[0].x, pointers[1].y - pointers[0].y);
}

export function AdjustablePhotoFrame({
  source,
  alt,
  adjustment = DEFAULT_PHOTO_ADJUSTMENT,
  mirrored = false,
  monochrome = false,
  active = false,
  priority = false,
  onActivate,
  onChange,
}: {
  source: string;
  alt: string;
  adjustment?: PhotoAdjustment;
  mirrored?: boolean;
  monochrome?: boolean;
  active?: boolean;
  priority?: boolean;
  onActivate: () => void;
  onChange: (adjustment: PhotoAdjustment) => void;
}) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const pointersRef = React.useRef(new Map<number, PointerPosition>());
  const gestureRef = React.useRef<Gesture | null>(null);
  const [frameSize, setFrameSize] = React.useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setFrameSize({ width: frame.clientWidth, height: frame.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const placement = imageSize.width && frameSize.width
    ? getCoverPlacement(imageSize.width, imageSize.height, frameSize.width, frameSize.height, adjustment)
    : null;

  function beginGesture() {
    const pointers = Array.from(pointersRef.current.values()).slice(0, 2);
    if (!pointers.length) {
      gestureRef.current = null;
      return;
    }
    gestureRef.current = {
      adjustment,
      pointers: new Map(pointersRef.current),
      center: pointerCenter(pointers),
      distance: pointerDistance(pointers),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    onActivate();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    beginGesture();
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId) || !gestureRef.current || !placement) return;
    event.preventDefault();
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const currentPointers = Array.from(pointersRef.current.values()).slice(0, 2);
    const currentCenter = pointerCenter(currentPointers);
    const gesture = gestureRef.current;
    const pinchRatio = currentPointers.length > 1 && gesture.distance > 0
      ? pointerDistance(currentPointers) / gesture.distance
      : 1;
    const zoom = Math.max(MIN_PHOTO_ZOOM, Math.min(MAX_PHOTO_ZOOM, gesture.adjustment.zoom * pinchRatio));
    const zoomPlacement = getCoverPlacement(
      imageSize.width,
      imageSize.height,
      frameSize.width,
      frameSize.height,
      { ...gesture.adjustment, zoom },
    );
    const displayedDeltaX = currentCenter.x - gesture.center.x;
    onChange({
      zoom,
      x: zoomPlacement.maxOffsetX > 0
        ? Math.max(-1, Math.min(1, gesture.adjustment.x + displayedDeltaX / zoomPlacement.maxOffsetX))
        : 0,
      y: zoomPlacement.maxOffsetY > 0
        ? Math.max(-1, Math.min(1, gesture.adjustment.y + (currentCenter.y - gesture.center.y) / zoomPlacement.maxOffsetY))
        : 0,
    });
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    beginGesture();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.12 : 0.04;
    let next = adjustment;
    if (event.key === "ArrowLeft") next = { ...adjustment, x: adjustment.x - step };
    else if (event.key === "ArrowRight") next = { ...adjustment, x: adjustment.x + step };
    else if (event.key === "ArrowUp") next = { ...adjustment, y: adjustment.y - step };
    else if (event.key === "ArrowDown") next = { ...adjustment, y: adjustment.y + step };
    else if (event.key === "+" || event.key === "=") next = { ...adjustment, zoom: adjustment.zoom + 0.1 };
    else if (event.key === "-") next = { ...adjustment, zoom: adjustment.zoom - 0.1 };
    else return;
    event.preventDefault();
    onActivate();
    onChange(next);
  }

  return (
    <div
      ref={frameRef}
      role="group"
      tabIndex={0}
      aria-label={`${alt}. Drag to reposition, pinch or use plus and minus to zoom.`}
      className={cn("absolute inset-0 cursor-grab touch-none overflow-hidden outline-none active:cursor-grabbing", active && "ring-2 ring-inset ring-[var(--booth-accent)]")}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onKeyDown={handleKeyDown}
    >
      {/* A native image keeps the calculated crop dimensions exact inside a measured frame. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={source}
        alt=""
        aria-hidden="true"
        draggable={false}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        className={cn("pointer-events-none absolute max-w-none select-none", monochrome && "grayscale")}
        style={placement ? {
          left: placement.left,
          top: placement.top,
          width: placement.width,
          height: placement.height,
          transform: mirrored ? "scaleX(-1)" : undefined,
        } : { width: "100%", height: "100%", objectFit: "cover", transform: mirrored ? "scaleX(-1)" : undefined }}
      />
    </div>
  );
}
