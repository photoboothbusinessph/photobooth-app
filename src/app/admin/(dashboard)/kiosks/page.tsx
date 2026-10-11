import { PageHeader } from "@/components/admin/page-header";
import { BusinessKioskManager } from "@/components/admin/business-kiosk-manager";
import { requireBusinessAdmin } from "@/lib/auth/session";
import { getCollections } from "@/lib/db/collections";

export default async function KiosksPage() {
  const { businessId } = await requireBusinessAdmin();
  const { businesses } = await getCollections();
  const business = await businesses.findOne({ _id: businessId }, { projection: { slug: 1 } });
  return <><PageHeader eyebrow="Device access" title="Kiosks" description="Pair a booth device with this business. Revoked devices cannot upload or sync sessions." />
    <p className="mb-6 text-muted-foreground">Generate a pairing code, then choose Open photobooth to enter it on this device.</p>
    <BusinessKioskManager pairHref={business?.slug ? `/b/${business.slug}/pair` : null} /></>;
}
