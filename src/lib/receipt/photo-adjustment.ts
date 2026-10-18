import type { PhotoAdjustment } from "@/types";

export const MIN_PHOTO_ZOOM = 1;
export const MAX_PHOTO_ZOOM = 3;
export const DEFAULT_PHOTO_ADJUSTMENT: PhotoAdjustment = { x: 0, y: 0, zoom: MIN_PHOTO_ZOOM };

export function clampPhotoAdjustment(adjustment: PhotoAdjustment): PhotoAdjustment {
  return {
    x: Math.max(-1, Math.min(1, adjustment.x)),
    y: Math.max(-1, Math.min(1, adjustment.y)),
    zoom: Math.max(MIN_PHOTO_ZOOM, Math.min(MAX_PHOTO_ZOOM, adjustment.zoom)),
  };
}

export function getCoverPlacement(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  adjustment: PhotoAdjustment = DEFAULT_PHOTO_ADJUSTMENT,
) {
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const safeFrameWidth = Math.max(1, frameWidth);
  const safeFrameHeight = Math.max(1, frameHeight);
  const normalized = clampPhotoAdjustment(adjustment);
  const coverScale = Math.max(safeFrameWidth / safeImageWidth, safeFrameHeight / safeImageHeight);
  const scale = coverScale * normalized.zoom;
  const width = safeImageWidth * scale;
  const height = safeImageHeight * scale;
  const maxOffsetX = Math.max(0, (width - safeFrameWidth) / 2);
  const maxOffsetY = Math.max(0, (height - safeFrameHeight) / 2);

  return {
    adjustment: normalized,
    scale,
    width,
    height,
    maxOffsetX,
    maxOffsetY,
    left: (safeFrameWidth - width) / 2 + normalized.x * maxOffsetX,
    top: (safeFrameHeight - height) / 2 + normalized.y * maxOffsetY,
    sourceX: (safeImageWidth - safeFrameWidth / scale) / 2 - normalized.x * (safeImageWidth - safeFrameWidth / scale) / 2,
    sourceY: (safeImageHeight - safeFrameHeight / scale) / 2 - normalized.y * (safeImageHeight - safeFrameHeight / scale) / 2,
    sourceWidth: safeFrameWidth / scale,
    sourceHeight: safeFrameHeight / scale,
  };
}
