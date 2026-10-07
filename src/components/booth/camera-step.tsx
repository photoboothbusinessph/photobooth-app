"use client";
import { usePathname } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";

import { BoothShell } from "@/components/layout/booth-shell";
import { CameraCapture } from "@/components/booth/camera-capture";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { StatusState } from "@/components/shared/status-state";
import { useBusinessStore } from "@/stores/business-store";
import { useBoothStore } from "@/stores/booth-store";

export function CameraStep({ requestedTemplateId }: { requestedTemplateId?: string }) {
  const base = boothBasePath(usePathname());
  const selectedId = useBoothStore((state) => state.selectedTemplateId);
  const templates = useBusinessStore((state) => state.templates);
  const template = templates.find((item) => item.id === (requestedTemplateId ?? selectedId)) ?? templates.find((item) => item.isDefault) ?? templates[0];
  if (!template) return <StatusState type="error" title="No templates available" description="Ask the booth administrator to add a receipt template." />;
  return <BoothShell title="Ready when you are" eyebrow={`${template.name} · ${template.photoSlots} shot${template.photoSlots === 1 ? "" : "s"}`} backHref={`${base}/booth/templates${base ? "" : `?template=${encodeURIComponent(template.id)}`}`} step="02 / 04"><BoothStepGuard requirement="template"><CameraCapture photoCount={template.photoSlots} templateId={template.id} templateName={template.name} /></BoothStepGuard></BoothShell>;
}
