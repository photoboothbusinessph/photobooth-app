import { CameraMock } from "@/components/booth/camera-mock";
import { BoothShell } from "@/components/layout/booth-shell";

export default function CameraPage() {
  return <BoothShell title="Ready when you are" eyebrow="Look at the lens" backHref="/booth/photo-count" step="03 / 05"><CameraMock /></BoothShell>;
}
