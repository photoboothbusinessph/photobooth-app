import { PreviewStep } from "@/components/booth/preview-step";

export default async function PreviewPage({ searchParams }: PageProps<"/booth/preview">) {
  const { template } = await searchParams;
  return <PreviewStep requestedTemplateId={Array.isArray(template) ? template[0] : template} />;
}
