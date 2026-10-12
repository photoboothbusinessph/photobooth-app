import { PageHeader } from "@/components/admin/page-header";
import { TemplateManager } from "@/components/admin/template-manager";

export default function TemplatesPage() {
  return <><PageHeader eyebrow="Receipt library" title="Templates" description="Create reusable generated layouts or upload transparent image-overlay designs." /><TemplateManager /></>;
}
