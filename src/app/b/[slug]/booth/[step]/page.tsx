import { notFound, redirect } from "next/navigation";
import { BoothExperience } from "@/components/booth/booth-experience";
import { requireKiosk } from "@/lib/auth/kiosk";

export default async function BusinessBoothStep({ params }: { params: Promise<{ slug: string; step: string }> }) {
  const { slug, step } = await params;
  try { await requireKiosk(slug); } catch { redirect(`/b/${slug}/pair`); }
  if (!["templates", "camera", "preview", "photo-qr", "social"].includes(step)) notFound();
  return <BoothExperience />;
}
