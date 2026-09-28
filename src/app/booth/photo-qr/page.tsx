import { BoothShell } from "@/components/layout/booth-shell";
import { QrResult } from "@/components/booth/qr-result";

export default function PhotoQrPage() {
  return <BoothShell title="Take it with you" eyebrow="Private link / online only" backHref="/booth/preview" step="05 / 05"><QrResult /></BoothShell>;
}
