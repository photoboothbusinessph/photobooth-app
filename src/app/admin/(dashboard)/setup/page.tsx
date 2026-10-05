import { PageHeader } from "@/components/admin/page-header";
import { BusinessSetupForm } from "@/components/admin/business-setup-form";

export default function BusinessSetupPage() {
  return (
    <>
      <PageHeader eyebrow="First-run configuration" title="Set up your booth" description="Add the business identity and starting color palette. No code changes are required to reuse this installation." />
      <BusinessSetupForm />
    </>
  );
}
