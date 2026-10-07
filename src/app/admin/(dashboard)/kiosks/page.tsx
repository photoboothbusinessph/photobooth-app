import { PageHeader } from "@/components/admin/page-header";
import { BusinessKioskManager } from "@/components/admin/business-kiosk-manager";

export default function KiosksPage() {
  return <><PageHeader eyebrow="Device access" title="Kiosks" description="Pair a booth device with this business. Revoked devices cannot upload or sync sessions." /><BusinessKioskManager /></>;
}
