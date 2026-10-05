import { CameraStep } from "@/components/booth/camera-step";

export default async function CameraPage({ searchParams }: PageProps<"/booth/camera">) {
  const { template } = await searchParams;
  return <CameraStep requestedTemplateId={Array.isArray(template) ? template[0] : template} />;
}
