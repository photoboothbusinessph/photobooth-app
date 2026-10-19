import { PageHeader } from "@/components/admin/page-header";
import { BrandingForm } from "@/components/admin/branding-form";

export default function BrandingPage() {
  return <><PageHeader eyebrow="Business identity" title="Branding" description="Manage the business identity, receipt copy, and guest-facing booth backgrounds." /><BrandingForm /></>;
}
