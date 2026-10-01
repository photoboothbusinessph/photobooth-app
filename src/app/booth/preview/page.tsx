import { BoothShell } from "@/components/layout/booth-shell";
import { PreviewStudio } from "@/components/booth/preview-studio";
import { templates } from "@/config/mock-data";

export default async function PreviewPage({ searchParams }: PageProps<"/booth/preview">) {
  const { template: templateParam } = await searchParams;
  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const template = templates.find((item) => item.id === templateId) ?? templates.find((item) => item.isDefault) ?? templates[0];

  return <BoothShell title="Your receipt is ready" eyebrow="Review before continuing" backHref={`/booth/camera?template=${template.id}`} step="03 / 04"><PreviewStudio template={template} /></BoothShell>;
}
