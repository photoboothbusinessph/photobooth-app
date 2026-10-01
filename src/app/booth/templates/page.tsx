import { BoothShell } from "@/components/layout/booth-shell";
import { TemplatePicker } from "@/components/booth/template-picker";
import { templates } from "@/config/mock-data";

export default async function TemplatesPage({ searchParams }: PageProps<"/booth/templates">) {
  const { template: templateParam } = await searchParams;
  const requestedId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const selectedId = templates.some((template) => template.id === requestedId) ? requestedId : "double";

  return <BoothShell title="Choose photo layout" eyebrow="Build your receipt" step="01 / 04"><TemplatePicker initialSelected={selectedId} /></BoothShell>;
}
