import { redirect } from "next/navigation";
import { BoothShell } from "@/components/layout/booth-shell";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { DesignPicker } from "@/components/booth/design-picker";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function DesignsPage() {
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}/booth/designs`);
  return <BoothShell title="Choose receipt design" eyebrow="Style your photos" backHref="/booth/camera" step="03 / 05"><BoothStepGuard requirement="photos"><DesignPicker /></BoothStepGuard></BoothShell>;
}
