"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useBoothRouter } from "@/hooks/use-booth-router";
import { boothBasePath, boothSlug } from "@/lib/booth-path";
import { StatusState } from "@/components/shared/status-state";
import { useBoothStore } from "@/stores/booth-store";
import { useBusinessStore } from "@/stores/business-store";

type Requirement = "session" | "template" | "photos";

export function BoothStepGuard({ children, requirement }: { children: React.ReactNode; requirement: Requirement }) {
  const router = useBoothRouter();
  const pathname = usePathname();
  const base = boothBasePath(pathname);
  const expectedTenantKey = boothSlug(pathname) ?? "legacy";
  const tenantKey = useBoothStore((state) => state.tenantKey);
  const hydrated = useBoothStore((state) => state.isHydrated);
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
    if (!hydrated || tenantKey !== expectedTenantKey) return;
    if (valid) return;
    if (!sessionId) router.replace(base || "/");
    else if (!template) router.replace(`${base}/booth/templates`);
    else router.replace(`${base}/booth/camera${base ? "" : `?template=${encodeURIComponent(template.id)}`}`);
  }, [base, expectedTenantKey, hydrated, router, sessionId, template, tenantKey, valid]);

  if (!hydrated || tenantKey !== expectedTenantKey || !valid) {
    return <StatusState type="loading" title="Checking session" description="Returning you to the correct booth step." className="min-h-[45vh] border-white/30 bg-black/10 text-white" />;
  }

  return children;
}
