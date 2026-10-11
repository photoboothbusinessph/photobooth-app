import { notFound, redirect } from "next/navigation";
import { getBusinessBySlug } from "@/lib/db/tenant";
import { requireKiosk } from "@/lib/auth/kiosk";
import { KioskPairForm } from "@/components/booth/kiosk-pair-form";
import { requireBusinessAdmin } from "@/lib/auth/session";

export default async function PairKioskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();
  try {
    const admin = await requireBusinessAdmin();
    if (admin.businessId !== business._id) redirect(`/b/${slug}`);
  } catch (error) {
    if (error instanceof Error && ["Unauthorized", "Forbidden"].includes(error.message)) redirect(`/b/${slug}`);
    throw error;
  }
  let paired = false;
  try { await requireKiosk(slug); paired = true; } catch { /* Unpaired devices stay on this page. */ }
  if (paired) redirect(`/b/${slug}`);
  return <KioskPairForm slug={slug} businessName={business.branding.name} />;
}
