import { CameraStep } from "@/components/booth/camera-step";
import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function CameraPage({ searchParams }: PageProps<"/booth/camera">) {
  await searchParams;
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}/booth/camera`);
  return <CameraStep />;
}
