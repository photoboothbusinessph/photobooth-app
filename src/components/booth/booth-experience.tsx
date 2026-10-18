"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";
import { BoothShell } from "@/components/layout/booth-shell";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { WelcomeScreen } from "@/components/booth/welcome-screen";
import { TemplatePicker } from "@/components/booth/template-picker";
import { DesignPicker } from "@/components/booth/design-picker";
import { CameraStep } from "@/components/booth/camera-step";
import { PreviewStep } from "@/components/booth/preview-step";
import { QrResult } from "@/components/booth/qr-result";

// Eager imports keep every step available offline. Server entry pages and APIs
// continue to enforce kiosk authorization.
export function BoothExperience() {
  const pathname = usePathname();
  const base = boothBasePath(pathname);
  const step = pathname.slice(base.length);
  const templateId = useSearchParams().get("template") ?? undefined;
  if (step === "/booth/templates")
    return (
      <BoothShell title="Choose photo layout" backHref={base} step="01 / 05">
        <BoothStepGuard requirement="session">
          <TemplatePicker />
        </BoothStepGuard>
      </BoothShell>
    );
  if (step === "/booth/camera") return <CameraStep />;
  if (step === "/booth/designs")
    return (
      <BoothShell title="Choose receipt design" backHref={`${base}/booth/camera`} step="03 / 05">
        <BoothStepGuard requirement="photos">
          <DesignPicker />
        </BoothStepGuard>
      </BoothShell>
    );
  if (step === "/booth/preview") return <PreviewStep requestedTemplateId={templateId} />;
  if (step === "/booth/photo-qr" || step === "/booth/social")
    return (
      <BoothShell
        title="Your photos are ready"
        eyebrow="Digital copy & social media"
        backHref={`${base}/booth/preview`}
        step="05 / 05"
        showCountdown={false}
      >
        <QrResult />
      </BoothShell>
    );
  return <WelcomeScreen />;
}
