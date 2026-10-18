import type { PhotoSlotCount, ReceiptSlotRect } from "@/types";

export function detectTransparentSlotRects(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  slots: PhotoSlotCount,
): ReceiptSlotRect[] {
  const minimumTransparentPixels = Math.max(8, Math.floor(width * 0.08));
  const activeRows = Array.from({ length: height }, (_, y) => {
    let transparentPixels = 0;
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= 16) transparentPixels += 1;
    }
    return transparentPixels >= minimumTransparentPixels;
  });
  const bands: Array<{ start: number; end: number }> = [];
  for (let y = 0; y < height; y += 1) {
    if (!activeRows[y]) continue;
    const start = y;
    while (y + 1 < height && activeRows[y + 1]) y += 1;
    bands.push({ start, end: y });
  }

  const candidates = bands.map((band) => {
    let left = width;
    let right = -1;
    for (let y = band.start; y <= band.end; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] <= 16) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }
    return { x: left, y: band.start, width: right - left + 1, height: band.end - band.start + 1 };
  }).filter((rect) => rect.width >= width * 0.2 && rect.height >= height * 0.05);

  const selected = candidates
    .sort((a, b) => b.width * b.height - a.width * a.height)
    .slice(0, slots)
    .sort((a, b) => a.y - b.y);
  if (selected.length !== slots) throw new Error(`The PNG must contain ${slots} separate transparent photo ${slots === 1 ? "window" : "windows"}.`);
  return selected;
}
