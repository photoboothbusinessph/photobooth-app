import { CameraMock } from "@/components/booth/camera-mock";
import { BoothShell } from "@/components/layout/booth-shell";
import { templates } from "@/config/mock-data";

export default async function CameraPage({ searchParams }: PageProps<"/booth/camera">) {
  const { template: templateParam } = await searchParams;
  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const template = templates.find((item) => item.id === templateId) ?? templates.find((item) => item.isDefault) ?? templates[0];

  return <BoothShell title="Ready when you are" eyebrow={`${template.name} · ${template.photoSlots} shot${template.photoSlots === 1 ? "" : "s"}`} backHref={`/booth/templates?template=${template.id}`} step="02 / 04"><CameraMock photoCount={template.photoSlots} templateId={template.id} templateName={template.name} /></BoothShell>;
}
