"use client";
import { usePathname } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";

import { BoothShell } from "@/components/layout/booth-shell";
import { PreviewStudio } from "@/components/booth/preview-studio";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { StatusState } from "@/components/shared/status-state";
import { useBusinessStore } from "@/stores/business-store";
import { useBoothStore } from "@/stores/booth-store";

export function PreviewStep({ requestedTemplateId }: { requestedTemplateId?: string }) {
  const base = boothBasePath(usePathname());
  const selectedId = useBoothStore((state) => state.selectedTemplateId);
  const templates = useBusinessStore((state) => state.templates);
  const template = templates.find((item) => item.id === (requestedTemplateId ?? selectedId)) ?? templates.find((item) => item.isDefault) ?? templates[0];
  if (!template) return <StatusState type="error" title="Template unavailable" description="Return to the start screen and ask the booth administrator for help." />;
  return <BoothShell title="Your receipt is ready" eyebrow="Review before continuing" backHref={`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(template.id)}`}`} step="03 / 04"><BoothStepGuard requirement="photos"><PreviewStudio template={template} /></BoothStepGuard></BoothShell>;
}
