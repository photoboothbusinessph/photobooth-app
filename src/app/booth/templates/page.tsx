import { BoothShell } from "@/components/layout/booth-shell";
import { TemplatePicker } from "@/components/booth/template-picker";

export default function TemplatesPage() {
  return <BoothShell title="Choose photo layout" eyebrow="Build your receipt" step="01 / 05"><TemplatePicker /></BoothShell>;
}
