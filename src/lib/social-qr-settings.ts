export const DEFAULT_PRIMARY_SOCIAL_QR_LABEL = "Social media";
export const DEFAULT_SECONDARY_SOCIAL_QR_LABEL = "Social media";
export const DEFAULT_DIGITAL_COPY_QR_LABEL = "Digital copy";

export function normalizeQrLabel(value: string | null | undefined, fallback: string) {
  const label = value?.trim();
  return label || fallback;
}
