import { PageHeader } from "@/components/admin/page-header";
import { TemplateManager } from "@/components/admin/template-manager";

export default function TemplatesPage() {
  return <><PageHeader eyebrow="Receipt library" title="Templates" description="Create and refine reusable photo layouts. All management actions remain in local component state." /><TemplateManager /></>;
}
