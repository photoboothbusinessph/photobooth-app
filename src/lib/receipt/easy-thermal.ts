function receiptFile(dataUrl: string) {
  const match = /^data:(image\/png);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("The receipt image is not available for sharing.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], `photobooth-receipt-${Date.now()}.png`, { type: match[1] });
}

export function shareReceiptWithEasyThermal(dataUrl: string, copies: number) {
  if (!Number.isInteger(copies) || copies < 1 || copies > 9)
    throw new Error("Choose between 1 and 9 copies.");
  if (!navigator.share)
    throw new Error("Android sharing is unavailable. Open the installed photobooth app in Chrome.");

  const file = receiptFile(dataUrl);
  const shareData: ShareData = {
    files: [file],
    title: "Photobooth receipt",
    text: `Open in Easy Thermal Print and print ${copies} ${copies === 1 ? "copy" : "copies"}.`,
  };
  if (navigator.canShare && !navigator.canShare({ files: shareData.files }))
    throw new Error("This browser cannot share the receipt image to Easy Thermal Print.");

  // This must run directly from the Print tap while Android still grants user activation.
  return navigator.share(shareData);
}
