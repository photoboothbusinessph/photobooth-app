import { PageHeader } from "@/components/admin/page-header";
import { SocialQrForm } from "@/components/admin/social-qr-form";

export default function SocialQrPage() {
  return <><PageHeader eyebrow="Guest follow-up" title="Social QR" description="Configure two social or business QR codes and customize the labels shown on the guest screen." /><SocialQrForm /></>;
}
