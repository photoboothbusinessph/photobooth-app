import { BoothShell } from "@/components/layout/booth-shell";
import { TemplatePicker } from "@/components/booth/template-picker";
import { BoothStepGuard } from "@/components/booth/booth-step-guard";

export default async function TemplatesPage({ searchParams }: PageProps<"/booth/templates">) {
  const { template: templateParam } = await searchParams;
  const requestedId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  return <BoothShell title="Choose photo layout" eyebrow="Build your receipt" step="01 / 04"><BoothStepGuard requirement="session"><TemplatePicker initialSelected={requestedId} /></BoothStepGuard></BoothShell>;
}
