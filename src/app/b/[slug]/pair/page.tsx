import { notFound, redirect } from "next/navigation";
import { getBusinessBySlug } from "@/lib/db/tenant";
import { requireKiosk } from "@/lib/auth/kiosk";
import { KioskPairForm } from "@/components/booth/kiosk-pair-form";

export default async function PairKioskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  let paired = false;
  try { await requireKiosk(slug); paired = true; } catch { /* Unpaired devices stay on this page. */ }
  if (paired) redirect(`/b/${slug}`);
  return <KioskPairForm slug={slug} businessName={business.branding.name} />;
}
