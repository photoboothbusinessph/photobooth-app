function receiptFile(dataUrl: string) {
  const match = /^data:(image\/png);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("The receipt image is not available for sharing.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], `photobooth-receipt-${Date.now()}.png`, { type: match[1] });
}

function validateCopies(copies: number) {
  if (!Number.isInteger(copies) || copies < 1 || copies > 9)
    throw new Error("Choose between 1 and 9 copies.");
}

function loadReceipt(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The receipt image could not be prepared for printing."));
    image.src = dataUrl;
  });
}

export async function createReceiptCopySheet(dataUrl: string, copies: number) {
  validateCopies(copies);
  if (copies === 1) return dataUrl;
  const image = await loadReceipt(dataUrl);
  const width = 576;
  const receiptHeight = Math.round(width * image.naturalHeight / image.naturalWidth);
  const gap = 24;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = receiptHeight * copies + gap * (copies - 1);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This device cannot prepare multiple receipt copies.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  for (let index = 0; index < copies; index += 1) {
    const top = index * (receiptHeight + gap);
    context.drawImage(image, 0, top, width, receiptHeight);
    if (index < copies - 1) {
      context.save();
      context.strokeStyle = "#777777";
      context.lineWidth = 1;
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(16, top + receiptHeight + gap / 2);
      context.lineTo(width - 16, top + receiptHeight + gap / 2);
      context.stroke();
      context.restore();
    }
  }
  return canvas.toDataURL("image/png");
}

export function shareReceiptWithEasyThermal(dataUrl: string, copies: number) {
  validateCopies(copies);
  if (!navigator.share)
    throw new Error("Android sharing is unavailable. Open the installed photobooth app in Chrome.");

  const file = receiptFile(dataUrl);
  const shareData: ShareData = {
    files: [file],
    title: "Photobooth receipt",
    text: copies === 1
      ? "Open in Easy Thermal Print and print this image once."
      : `Open in Easy Thermal Print and print this image once. It already contains ${copies} receipt copies.`,
  };
  if (navigator.canShare && !navigator.canShare({ files: shareData.files }))
    throw new Error("This browser cannot share the receipt image to Easy Thermal Print.");

  // This must run directly from the Print tap while Android still grants user activation.
  return navigator.share(shareData);
}
