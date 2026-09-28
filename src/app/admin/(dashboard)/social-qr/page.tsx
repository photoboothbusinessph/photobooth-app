import { PageHeader } from "@/components/admin/page-header";
import { SocialQrForm } from "@/components/admin/social-qr-form";

export default function SocialQrPage() {
  return <><PageHeader eyebrow="Guest follow-up" title="Social QR" description="Preview the final guest CTA, including the empty state used when no QR image is available." /><SocialQrForm /></>;
}
