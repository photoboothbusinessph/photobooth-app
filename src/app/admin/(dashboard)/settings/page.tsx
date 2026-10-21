import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function SettingsPage() {
  return <><PageHeader eyebrow="Booth defaults" title="Settings" description="Manage the guest session timer and review the booth defaults used by guests." /><SettingsForm /></>;
}
