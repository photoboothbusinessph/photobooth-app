import { redirect } from "next/navigation";
import { BoothExperience } from "@/components/booth/booth-experience";
import { requireKiosk } from "@/lib/auth/kiosk";
import { getBusinessBySlug } from "@/lib/db/tenant";

export default async function BusinessBoothPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getBusinessBySlug(slug))) redirect("/");
  try { await requireKiosk(slug); } catch { redirect(`/b/${slug}/pair`); }
  return <BoothExperience />;
}
