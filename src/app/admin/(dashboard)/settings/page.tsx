import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function SettingsPage() {
  return <><PageHeader eyebrow="Booth defaults" title="Settings" description="Define the capture defaults guests will see when functional state is added in a later phase." /><SettingsForm /></>;
}
