import { CameraStep } from "@/components/booth/camera-step";
import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function CameraPage({ searchParams }: PageProps<"/booth/camera">) {
  const { template } = await searchParams;
  const templateId = Array.isArray(template) ? template[0] : template;
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}/booth/camera${templateId ? `?template=${encodeURIComponent(templateId)}` : ""}`);
  return <CameraStep requestedTemplateId={templateId} />;
}
