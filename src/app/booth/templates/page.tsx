import { BoothShell } from "@/components/layout/booth-shell";
import { TemplatePicker } from "@/components/booth/template-picker";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";
import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function TemplatesPage({ searchParams }: PageProps<"/booth/templates">) {
  const { template: templateParam } = await searchParams;
  const requestedId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}/booth/templates${requestedId ? `?template=${encodeURIComponent(requestedId)}` : ""}`);
  return <BoothShell title="Choose photo layout" eyebrow="Choose your number of shots" step="01 / 05"><BoothStepGuard requirement="session"><TemplatePicker /></BoothStepGuard></BoothShell>;
}
