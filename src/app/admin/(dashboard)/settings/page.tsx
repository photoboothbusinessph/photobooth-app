import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export default function SettingsPage() {
  return <><PageHeader eyebrow="Booth defaults" title="Settings" description="Review the booth defaults and automatic receipt sizes used by guests." /><SettingsForm /></>;
}
