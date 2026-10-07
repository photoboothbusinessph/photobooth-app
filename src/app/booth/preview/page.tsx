import { PreviewStep } from "@/components/booth/preview-step";
import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function PreviewPage({ searchParams }: PageProps<"/booth/preview">) {
  const { template } = await searchParams;
  const templateId = Array.isArray(template) ? template[0] : template;
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}/booth/preview${templateId ? `?template=${encodeURIComponent(templateId)}` : ""}`);
  return <PreviewStep requestedTemplateId={templateId} />;
}
