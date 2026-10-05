import type { BusinessBranding, CapturedPhoto, ReceiptTemplate, ThemePalette } from "@/types";

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//.test(source)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load a receipt image."));
    image.src = source;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function receiptRatio(size: string) {
  const dimensions = size.match(/(\d+)\D+(\d+)/);
  if (!dimensions) return 1.8;
  return Number(dimensions[2]) / Number(dimensions[1]);
}

export async function renderReceiptImage({ template, photos, branding, palette, monochrome }: { template: ReceiptTemplate; photos: CapturedPhoto[]; branding: BusinessBranding; palette: ThemePalette; monochrome: boolean }) {
  const width = 800;
  const height = Math.round(width * receiptRatio(template.size));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image rendering is not supported in this browser.");
  const brandContext = context;

  context.fillStyle = palette.background;
  context.fillRect(0, 0, width, height);
  context.textAlign = "right";
  context.fillStyle = palette.text;
  context.font = "700 16px sans-serif";
  context.fillText("RECEIPT NO. " + new Date().getTime().toString().slice(-6), width - 48, 62);
  context.textAlign = "left";

  async function drawBrandMark(x: number, y: number, maxWidth: number, maxHeight: number) {
    if ((branding.logoMode ?? (branding.logoDataUrl ? "image" : "text")) === "image" && branding.logoDataUrl) {
      try {
        const logo = await loadImage(branding.logoDataUrl);
        const ratio = Math.min(maxWidth / logo.naturalWidth, maxHeight / logo.naturalHeight);
        brandContext.drawImage(logo, x, y, logo.naturalWidth * ratio, logo.naturalHeight * ratio);
        return;
      } catch {
        // Keep the text mark when an uploaded image cannot be loaded.
      }
    }
    await document.fonts.ready;
    const fonts = getComputedStyle(document.documentElement);
    const family = branding.logoFont === "sans" ? fonts.getPropertyValue("--font-space-grotesk") || "sans-serif" : branding.logoFont === "mono" ? "monospace" : fonts.getPropertyValue("--font-bodoni") || "serif";
    brandContext.fillStyle = branding.logoColor ?? palette.text;
    brandContext.font = `${branding.logoFont === "sans" ? "700" : "400"} ${Math.min(maxHeight, 46)}px ${family.trim()}`;
    brandContext.fillText(branding.monogram || branding.name, x, y + Math.min(maxHeight, 46), maxWidth);
  }

  if (template.logoPlacement === "bottom") {
    context.fillStyle = palette.text;
    context.font = "700 24px sans-serif";
    context.fillText("PHOTO RECEIPT", 48, 64);
  } else await drawBrandMark(48, 12, 520, 56);

  const padding = 48;
  const gap = 14;
  const top = 100;
  const footerHeight = 92;
  const contentHeight = height - top - footerHeight - padding;
  const columns = template.layout === "quad" ? 2 : 1;
  const rows = template.layout === "quad" ? 2 : template.photoSlots;
  const slotWidth = (width - padding * 2 - gap * (columns - 1)) / columns;
  const slotHeight = (contentHeight - gap * (rows - 1)) / rows;
  const images = await Promise.all(photos.slice(0, template.photoSlots).map((photo) => loadImage(photo.dataUrl)));

  images.forEach((image, index) => {
    const column = template.layout === "quad" ? index % 2 : 0;
    const row = template.layout === "quad" ? Math.floor(index / 2) : index;
    const x = padding + column * (slotWidth + gap);
    const y = top + row * (slotHeight + gap);
    context.save();
    context.filter = monochrome ? "grayscale(1)" : "none";
    drawCover(context, image, x, y, slotWidth, slotHeight);
    context.restore();
    context.fillStyle = "#101010";
    context.fillRect(x + slotWidth - 42, y + slotHeight - 30, 42, 30);
    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.font = "700 15px sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), x + slotWidth - 21, y + slotHeight - 10);
  });

  context.textAlign = "left";
  context.fillStyle = palette.text;
  context.font = "700 18px sans-serif";
  context.fillText(branding.footerText.toUpperCase(), padding, height - 50);
  context.font = "14px sans-serif";
  context.globalAlpha = 0.65;
  context.fillText(new Date().toLocaleDateString("en-PH"), padding, height - 25);
  context.globalAlpha = 1;
  if (template.logoPlacement === "bottom") await drawBrandMark(width - 220, height - 88, 172, 54);
  else {
    context.fillStyle = palette.primary;
    context.beginPath();
    context.arc(width - 64, height - 50, 16, 0, Math.PI * 2);
    context.fill();
  }

  return canvas.toDataURL("image/png");
}

export function downloadReceiptImage(source: string, filename: string) {
  const link = document.createElement("a");
  link.href = source;
  link.download = filename;
  link.click();
}

export function printImageSource(source: string, title: string) {
  const printWindow = window.open("", "_blank", "popup,width=800,height=900");
  if (!printWindow) return false;
  printWindow.document.title = title;
  const style = printWindow.document.createElement("style");
  style.textContent = "html,body{margin:0;background:#fff}body{display:grid;place-items:center;min-height:100vh}img{display:block;max-width:100%;height:auto}@media print{img{width:80mm;max-width:none}}";
  const image = printWindow.document.createElement("img");
  image.alt = title;
  image.src = source;
  image.onload = () => { printWindow.focus(); printWindow.print(); };
  printWindow.document.head.append(style);
  printWindow.document.body.append(image);
  return true;
}
