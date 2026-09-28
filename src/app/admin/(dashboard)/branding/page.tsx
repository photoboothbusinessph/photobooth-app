import { PageHeader } from "@/components/admin/page-header";
import { BrandingForm } from "@/components/admin/branding-form";

export default function BrandingPage() {
  return <><PageHeader eyebrow="Business identity" title="Branding" description="Shape the guest-facing name, logo, and receipt copy. Changes remain in this browser preview only." /><BrandingForm /></>;
}
