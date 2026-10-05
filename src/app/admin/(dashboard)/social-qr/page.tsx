import { PageHeader } from "@/components/admin/page-header";
import { SocialQrForm } from "@/components/admin/social-qr-form";

export default function SocialQrPage() {
  return <><PageHeader eyebrow="Guest follow-up" title="Social QR" description="Add your social profile link to generate a scannable QR code for guests automatically." /><SocialQrForm /></>;
}
