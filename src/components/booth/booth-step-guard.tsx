"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StatusState } from "@/components/shared/status-state";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

type Requirement = "session" | "template" | "photos";

export function BoothStepGuard({ children, requirement }: { children: React.ReactNode; requirement: Requirement }) {
  const router = useRouter();
  const sessionId = useBoothStore((state) => state.sessionId);
  const selectedTemplateId = useBoothStore((state) => state.selectedTemplateId);
  const capturedPhotos = useBoothStore((state) => state.capturedPhotos);
  const templates = useBusinessStore((state) => state.templates);
  const template = templates.find((item) => item.id === selectedTemplateId);
  const valid = Boolean(
    sessionId
    && (requirement === "session" || template)
    && (requirement !== "photos" || (template && capturedPhotos.length >= template.photoSlots)),
  );

  React.useEffect(() => {
    if (valid) return;
    if (!sessionId) router.replace("/");
    else if (!template) router.replace("/booth/templates");
    else router.replace(`/booth/camera?template=${template.id}`);
  }, [router, sessionId, template, valid]);

  if (!valid) {
    return <StatusState type="loading" title="Checking session" description="Returning you to the correct booth step." className="min-h-[45vh] border-white/30 bg-black/10 text-white" />;
  }

  return children;
}
