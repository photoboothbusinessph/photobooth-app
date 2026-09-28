import { PhotoCountPicker } from "@/components/booth/photo-count-picker";
import { BoothShell } from "@/components/layout/booth-shell";

export default function PhotoCountPage() {
  return <BoothShell title="How many shots?" eyebrow="Double Take supports up to four" backHref="/booth/templates" step="02 / 05"><PhotoCountPicker /></BoothShell>;
}
