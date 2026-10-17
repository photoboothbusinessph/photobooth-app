import { notFound, redirect } from "next/navigation";
import { BoothExperience } from "@/components/booth/booth-experience";
import { requireKiosk } from "@/lib/auth/kiosk";

export default async function BusinessBoothStep({ params }: { params: Promise<{ slug: string; step: string }> }) {
  const { slug, step } = await params;
  try { await requireKiosk(slug); } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Forbidden"].includes(error.message)) redirect(`/b/${slug}`);
    throw error;
  }
  if (!["templates", "camera", "designs", "preview", "photo-qr", "social"].includes(step)) notFound();
  if (step === "social") redirect(`/b/${slug}/booth/photo-qr`);
  return <BoothExperience />;
}
