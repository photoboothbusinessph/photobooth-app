import { BoothShell } from "@/components/layout/booth-shell";
import { PreviewStudio } from "@/components/booth/preview-studio";

export default function PreviewPage() {
  return <BoothShell title="Your receipt is ready" eyebrow="Review before continuing" backHref="/booth/camera" step="04 / 05"><PreviewStudio /></BoothShell>;
}
