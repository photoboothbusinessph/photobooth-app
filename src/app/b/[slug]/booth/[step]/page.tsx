import { notFound, redirect } from "next/navigation";
import { BoothShell } from "@/components/layout/booth-shell";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { TemplatePicker } from "@/components/booth/template-picker";
import { CameraStep } from "@/components/booth/camera-step";
import { PreviewStep } from "@/components/booth/preview-step";
import { QrResult } from "@/components/booth/qr-result";
import { SocialResult } from "@/components/booth/social-result";
import { requireKiosk } from "@/lib/auth/kiosk";

export default async function BusinessBoothStep({ params, searchParams }: { params: Promise<{ slug: string; step: string }>; searchParams: Promise<{ template?: string | string[] }> }) {
  const { slug, step } = await params;
  const template = (await searchParams).template;
  const templateId = Array.isArray(template) ? template[0] : template;
  try { await requireKiosk(slug); } catch { redirect(`/b/${slug}/pair`); }
  const base = `/b/${slug}/booth`;
  if (step === "templates") return <BoothShell title="Choose photo layout" eyebrow="Build your receipt" backHref={`/b/${slug}`} step="01 / 04"><BoothStepGuard requirement="session"><TemplatePicker initialSelected={templateId} /></BoothStepGuard></BoothShell>;
  if (step === "camera") return <CameraStep requestedTemplateId={templateId} />;
  if (step === "preview") return <PreviewStep requestedTemplateId={templateId} />;
  if (step === "photo-qr") return <BoothShell title="Take it with you" eyebrow="Private link / online only" backHref={`${base}/preview`} step="04 / 04" showCountdown={false}><QrResult templateId={templateId} /></BoothShell>;
  if (step === "social") return <BoothShell title="One last thing" eyebrow="Thanks for visiting" backHref={`${base}/photo-qr`} showCountdown={false}><SocialResult /></BoothShell>;
  notFound();
}
