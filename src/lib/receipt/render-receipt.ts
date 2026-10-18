import type { BusinessBranding, CapturedPhoto, PhotoAdjustment, PhotoSlotCount, ReceiptDesignStyle, ReceiptTemplate, ThemePalette } from "@/types";
import { DEFAULT_PHOTO_ADJUSTMENT, getCoverPlacement } from "@/lib/receipt/photo-adjustment";
import { normalizeReceiptTemplate, receiptDesignSlotRects, receiptMillimeters, receiptSizeForSlots } from "@/lib/receipt/template-rules";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//.test(source)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load a receipt image."));
    image.src = source;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, adjustment: PhotoAdjustment) {
  const placement = getCoverPlacement(image.naturalWidth, image.naturalHeight, width, height, adjustment);
  context.drawImage(image, placement.sourceX, placement.sourceY, placement.sourceWidth, placement.sourceHeight, x, y, width, height);
}

function drawAdaptiveFooter(context: CanvasRenderingContext2D, style: ReceiptDesignStyle, width: number, height: number) {
  context.fillStyle = "#101010";
  context.textAlign = "left";
  if (style === "calendar") {
    const top = Math.round(height * 0.77);
    context.fillRect(48, top, width - 96, 3);
    context.font = "700 20px sans-serif";
    context.fillText("DATE:", 48, top + 38);
    context.textAlign = "right";
    context.fillText(`YEAR: ${new Date().getFullYear()}`, width - 48, top + 38);
    context.textAlign = "center";
    context.font = "700 13px sans-serif";
    const labels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    labels.forEach((label, index) => context.fillText(label, 70 + index * ((width - 140) / 6), top + 65));
    context.font = "13px sans-serif";
    Array.from({ length: 31 }, (_, index) => {
      const column = index % 7;
      const row = Math.floor(index / 7);
      context.fillText(String(index + 1), 70 + column * ((width - 140) / 6), top + 92 + row * 24);
    });
    return;
  }
  if (style === "social-post") {
    context.font = "36px sans-serif";
    context.fillText("♥   ◯   △", 48, height - 52);
    context.textAlign = "right";
    context.fillText("♡", width - 48, height - 52);
    return;
  }
  if (style === "barcode") {
    const top = Math.round(height * 0.81);
    context.textAlign = "center";
    context.font = "700 22px sans-serif";
    context.fillText("GOD IS GOOD ALL THE TIME", width / 2, top);
    const pattern = [2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1];
    let x = 72;
    let patternIndex = 0;
    while (x < width - 72) {
      const barWidth = pattern[patternIndex % pattern.length] * 2;
      context.fillRect(x, top + 20, Math.min(barWidth, width - 72 - x), Math.round(height * 0.105));
      x += barWidth + pattern[(patternIndex + 5) % pattern.length] * 2;
      patternIndex += 1;
    }
    context.font = "12px monospace";
    context.fillText("0 35545 62336 78 1", width / 2, height - 18);
    return;
  }
  const top = Math.round(height * 0.78);
  context.fillRect(0, top, width, 42);
  context.fillStyle = "#ffffff";
  context.textAlign = "right";
  context.font = "700 17px sans-serif";
  context.fillText("MANILA       CANADA", width - 42, top + 27);
  context.save();
  context.translate(width - 137, top + 21);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.beginPath(); context.moveTo(-12, 0); context.lineTo(12, 0); context.moveTo(0, -8); context.lineTo(5, 0); context.lineTo(0, 8); context.moveTo(-7, -5); context.lineTo(-3, 0); context.lineTo(-7, 5); context.stroke();
  context.restore();
  context.fillStyle = "#101010";
  context.textAlign = "center";
  context.font = "700 48px sans-serif";
  context.fillText("MNL → CAD", width * 0.32, top + 125);
  context.beginPath();
  context.setLineDash([8, 7]);
  context.moveTo(width * 0.63, top + 42);
  context.lineTo(width * 0.63, height);
  context.strokeStyle = "#101010";
  context.lineWidth = 2;
  context.stroke();
  context.setLineDash([]);
  context.textAlign = "left";
  context.font = "20px serif";
  context.fillText("Flight", width * 0.67, top + 68);
  context.fillText("of 2501", width * 0.67, top + 91);
  context.fillText("date     Seat", width * 0.67, top + 121);
  context.fillText("01       25A", width * 0.67, top + 144);
  context.fillText("Departure", width * 0.67, top + 174);
  context.fillText("10:25 PM", width * 0.67, top + 197);
  const barcodeLeft = width - 56;
  for (let bar = 0; bar < 14; bar += 1) context.fillRect(barcodeLeft + bar * 2, top + 62, bar % 3 === 0 ? 2 : 1, Math.min(150, height - top - 74));
}

export async function renderReceiptImage({ template, photoSlots, photos, branding, palette, monochrome, mirrored = false, photoAdjustments }: { template: ReceiptTemplate; photoSlots?: PhotoSlotCount; photos: CapturedPhoto[]; branding: BusinessBranding; palette: ThemePalette; monochrome: boolean; mirrored?: boolean; photoAdjustments?: PhotoAdjustment[] }) {
  const normalizedTemplate = normalizeReceiptTemplate(template);
  const count = photoSlots ?? normalizedTemplate.photoSlots as PhotoSlotCount;
  const dimensions = receiptMillimeters(receiptSizeForSlots(count));
  const width = 800;
  const height = Math.round(width * dimensions.height / dimensions.width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image rendering is not supported in this browser.");
  const receiptContext = context;
  const overlayMode = normalizedTemplate.designMode === "image-overlay" && normalizedTemplate.overlayImageUrl;
  const style = normalizedTemplate.designStyle ?? "classic";

  context.fillStyle = overlayMode ? "#ffffff" : palette.background;
  context.fillRect(0, 0, width, height);
  const rects = overlayMode && normalizedTemplate.overlaySlotRects?.length === count
    ? normalizedTemplate.overlaySlotRects
    : receiptDesignSlotRects(style, count, width, height);
  const images = await Promise.all(photos.slice(0, count).map((photo) => loadImage(photo.dataUrl)));
  images.forEach((image, index) => {
    const rect = rects[index];
    if (!rect) return;
    const adjustment = photoAdjustments?.[index] ?? DEFAULT_PHOTO_ADJUSTMENT;
    const outputAdjustment = mirrored ? { ...adjustment, x: -adjustment.x } : adjustment;
    context.save();
    context.filter = monochrome ? "grayscale(1)" : "none";
    if (mirrored) { context.translate(rect.x + rect.width, rect.y); context.scale(-1, 1); drawCover(context, image, 0, 0, rect.width, rect.height, outputAdjustment); }
    else drawCover(context, image, rect.x, rect.y, rect.width, rect.height, outputAdjustment);
    context.restore();
  });

  if (overlayMode) {
    context.drawImage(await loadImage(normalizedTemplate.overlayImageUrl!), 0, 0, width, height);
    return canvas.toDataURL("image/png");
  }

  async function drawBrandMark(x: number, y: number, maxWidth: number, maxHeight: number) {
    if ((branding.logoMode ?? (branding.logoDataUrl ? "image" : "text")) === "image" && branding.logoDataUrl) {
      try {
        const logo = await loadImage(branding.logoDataUrl);
        const ratio = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight);
        receiptContext.drawImage(logo, x, y, logo.naturalWidth * ratio, logo.naturalHeight * ratio);
        return;
      } catch { /* Use the text mark when an uploaded image cannot be loaded. */ }
    }
    await document.fonts.ready;
    const fonts = getComputedStyle(document.documentElement);
    const family = branding.logoFont === "sans" ? fonts.getPropertyValue("--font-space-grotesk") || "sans-serif" : branding.logoFont === "mono" ? "monospace" : fonts.getPropertyValue("--font-bodoni") || "serif";
    receiptContext.fillStyle = branding.logoColor ?? palette.text;
    receiptContext.font = `${branding.logoFont === "sans" ? "700" : "400"} ${Math.min(maxHeight, 46)}px ${family.trim()}`;
    receiptContext.fillText(branding.monogram || branding.name, x, y + Math.min(maxHeight, 46), maxWidth);
  }

  async function drawCenteredBrandMark(y: number, maxWidth: number, maxHeight: number) {
    if ((branding.logoMode ?? (branding.logoDataUrl ? "image" : "text")) === "image" && branding.logoDataUrl) {
      try {
        const logo = await loadImage(branding.logoDataUrl);
        const ratio = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight);
        const logoWidth = logo.naturalWidth * ratio;
        receiptContext.drawImage(logo, (width - logoWidth) / 2, y, logoWidth, logo.naturalHeight * ratio);
        return;
      } catch { /* Use the centered text mark when an uploaded image cannot be loaded. */ }
    }
    await document.fonts.ready;
    const fonts = getComputedStyle(document.documentElement);
    const family = branding.logoFont === "sans" ? fonts.getPropertyValue("--font-space-grotesk") || "sans-serif" : branding.logoFont === "mono" ? "monospace" : fonts.getPropertyValue("--font-bodoni") || "serif";
    receiptContext.fillStyle = branding.logoColor ?? palette.text;
    receiptContext.textAlign = "center";
    receiptContext.font = `${branding.logoFont === "sans" ? "700" : "400"} ${Math.min(maxHeight, 46)}px ${family.trim()}`;
    receiptContext.fillText(branding.monogram || branding.name, width / 2, y + Math.min(maxHeight, 46), maxWidth);
  }

  if (style !== "classic") {
    context.textAlign = "left";
    if (style === "social-post") {
      context.strokeStyle = "#101010";
      context.lineWidth = 3;
      context.beginPath(); context.arc(72, 68, 24, 0, Math.PI * 2); context.stroke();
      context.fillStyle = "#101010";
      context.font = "700 18px sans-serif";
      context.fillText(branding.name.toUpperCase(), 110, 75, 560);
      context.font = "700 30px sans-serif";
      context.fillText("⋮", width - 70, 75);
    } else {
      await drawCenteredBrandMark(25, width - 96, 55);
      context.fillStyle = "#101010";
      context.textAlign = "center";
      context.font = "700 11px sans-serif";
      context.fillText("RECEIPT PHOTOBOOTH", width / 2, 98);
    }
    drawAdaptiveFooter(context, style, width, height);
    return canvas.toDataURL("image/png");
  }

  context.textAlign = "right";
  context.fillStyle = palette.text;
  context.font = "700 16px sans-serif";
  context.fillText("RECEIPT NO. " + new Date().getTime().toString().slice(-6), width - 48, 62);
  context.textAlign = "left";
  if (normalizedTemplate.logoPlacement === "bottom") { context.font = "700 24px sans-serif"; context.fillText("PHOTO RECEIPT", 48, 64); }
  else await drawBrandMark(48, 12, 520, 56);

  images.forEach((_image, index) => {
    const rect = rects[index];
    if (!rect) return;
    context.fillStyle = "#101010";
    context.fillRect(rect.x + rect.width - 42, rect.y + rect.height - 30, 42, 30);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "700 15px sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), rect.x + rect.width - 21, rect.y + rect.height - 10);
  });
  context.textAlign = "left";
  context.fillStyle = palette.text;
  context.font = "700 18px sans-serif";
  context.fillText(branding.footerText.toUpperCase(), 48, height - 50);
  context.font = "14px sans-serif";
  context.globalAlpha = 0.65;
  context.fillText(new Date().toLocaleDateString("en-PH"), 48, height - 25);
  context.globalAlpha = 1;
  if (normalizedTemplate.logoPlacement === "bottom") await drawBrandMark(width - 220, height - 88, 172, 54);
  else { context.fillStyle = palette.primary; context.beginPath(); context.arc(width - 64, height - 50, 16, 0, Math.PI * 2); context.fill(); }
  return canvas.toDataURL("image/png");
}

export function downloadReceiptImage(source: string, filename: string) {
  const link = document.createElement("a"); link.href = source; link.download = filename; link.click();
}

export function printImageSource(source: string, title: string) {
  const printWindow = window.open("", "_blank", "popup,width=800,height=900");
  if (!printWindow) return false;
  printWindow.document.title = title;
  const style = printWindow.document.createElement("style");
  style.textContent = "html,body{margin:0;background:#fff}body{display:grid;place-items:center;min-height:100vh}img{display:block;max-width:100%;height:auto}@media print{img{width:80mm;max-width:none}}";
  const image = printWindow.document.createElement("img");
  image.alt = title; image.src = source; image.onload = () => { printWindow.focus(); printWindow.print(); };
  printWindow.document.head.append(style); printWindow.document.body.append(image);
  return true;
}
