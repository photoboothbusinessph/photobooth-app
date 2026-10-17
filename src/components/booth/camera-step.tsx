"use client";
import { usePathname } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";

import { BoothShell } from "@/components/layout/booth-shell";
import { CameraCapture } from "@/components/booth/camera-capture";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { useBusinessStore } from "@/stores/business-store";
import { useBoothStore } from "@/stores/booth-store";

export function CameraStep() {
  const base = boothBasePath(usePathname());
  const selectedId = useBoothStore((state) => state.selectedTemplateId);
  const selectedPhotoSlots = useBoothStore((state) => state.selectedPhotoSlots);
  const templates = useBusinessStore((state) => state.templates);
  const legacyTemplate = templates.find((item) => item.id === selectedId);
  const photoCount = selectedPhotoSlots ?? legacyTemplate?.photoSlots ?? 1;
  return <BoothShell title="Ready when you are" eyebrow={`${photoCount} shot${photoCount === 1 ? "" : "s"}`} backHref={`${base}/booth/templates`} step="02 / 05"><BoothStepGuard requirement="layout"><CameraCapture photoCount={photoCount} /></BoothStepGuard></BoothShell>;
}
