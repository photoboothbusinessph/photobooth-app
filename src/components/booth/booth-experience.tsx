"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";
import { BoothShell } from "@/components/layout/booth-shell";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { WelcomeScreen } from "@/components/booth/welcome-screen";
import { TemplatePicker } from "@/components/booth/template-picker";
import { CameraStep } from "@/components/booth/camera-step";
import { PreviewStep } from "@/components/booth/preview-step";
import { QrResult } from "@/components/booth/qr-result";
import { SocialResult } from "@/components/booth/social-result";

// Eager imports keep every step available offline. Server entry pages and APIs
// continue to enforce kiosk authorization.
export function BoothExperience() {
  const pathname = usePathname();
  const base = boothBasePath(pathname);
  const step = pathname.slice(base.length);
  const templateId = useSearchParams().get("template") ?? undefined;
  if (step === "/booth/templates") return <BoothShell title="Choose photo layout" eyebrow="Build your receipt" backHref={base} step="01 / 04"><BoothStepGuard requirement="session"><TemplatePicker initialSelected={templateId} /></BoothStepGuard></BoothShell>;
  if (step === "/booth/camera") return <CameraStep requestedTemplateId={templateId} />;
  if (step === "/booth/preview") return <PreviewStep requestedTemplateId={templateId} />;
  if (step === "/booth/photo-qr") return <BoothShell title="Take it with you" eyebrow="Private link / online only" backHref={`${base}/booth/preview`} step="04 / 04" showCountdown={false}><QrResult templateId={templateId} /></BoothShell>;
  if (step === "/booth/social") return <BoothShell title="One last thing" eyebrow="Thanks for visiting" backHref={`${base}/booth/photo-qr`} showCountdown={false}><SocialResult /></BoothShell>;
  return <WelcomeScreen />;
}
