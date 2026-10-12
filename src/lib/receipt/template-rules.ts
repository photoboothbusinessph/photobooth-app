import type { ReceiptTemplate, TemplateLayout } from "@/types";

export const receiptSizeBySlots = {
  1: "80 × 100 mm",
  2: "80 × 150 mm",
  3: "80 × 150 mm",
  4: "80 × 200 mm",
} as const;

export const overlayPixelsBySlots = {
  1: { width: 800, height: 1000 },
  2: { width: 800, height: 1500 },
  3: { width: 800, height: 1500 },
  4: { width: 800, height: 2000 },
} as const;

export const slotCountByLayout: Record<TemplateLayout, 1 | 2 | 3 | 4> = {
  single: 1,
  double: 2,
  triple: 3,
  quad: 4,
};

export function receiptSizeForSlots(slots: number) {
  return receiptSizeBySlots[Math.min(4, Math.max(1, slots)) as 1 | 2 | 3 | 4];
}

export function receiptMillimeters(size: string) {
  const dimensions = size.match(/(\d+)\D+(\d+)/);
  return {
    width: Number(dimensions?.[1] ?? 80),
    height: Number(dimensions?.[2] ?? 150),
  };
}

export function normalizeReceiptTemplate<T extends ReceiptTemplate>(template: T): T {
  return { ...template, size: receiptSizeForSlots(template.photoSlots) };
}

export function receiptSlotRects(slots: number, width: number, height: number) {
  const count = Math.min(4, Math.max(1, slots));
  const side = Math.round(width * 0.06);
  const top = Math.round(width * 0.15);
  const bottom = Math.round(width * 0.1);
  const gap = Math.round(width * 0.018);
  const slotWidth = width - side * 2;
  const slotHeight = (height - top - bottom - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    x: side,
    y: top + index * (slotHeight + gap),
    width: slotWidth,
    height: slotHeight,
  }));
}
