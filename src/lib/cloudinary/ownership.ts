import "server-only";

export function isBusinessAsset(publicId: string, businessId: string) {
  if (publicId.startsWith(`receipt-photobooth/${businessId}/`)) return true;
  return businessId === "default" && /^receipt-photobooth\/(?:logo|social-qr)\/[A-Za-z0-9_/-]+$/.test(publicId);
}
