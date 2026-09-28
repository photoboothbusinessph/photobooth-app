import { PageHeader } from "@/components/admin/page-header";
import { ThemeEditor } from "@/components/admin/theme-editor";

export default function ThemePage() {
  return <><PageHeader eyebrow="Visual system" title="Theme colors" description="Tune the shared booth palette and see the application and receipt template update together." /><ThemeEditor /></>;
}
