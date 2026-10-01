import { BoothShell } from "@/components/layout/booth-shell";
import { QrResult } from "@/components/booth/qr-result";

export default async function PhotoQrPage({ searchParams }: PageProps<"/booth/photo-qr">) {
  const { template: templateParam } = await searchParams;
  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const backHref = templateId ? `/booth/preview?template=${templateId}` : "/booth/preview";

  return <BoothShell title="Take it with you" eyebrow="Private link / online only" backHref={backHref} step="04 / 04" showCountdown={false}><QrResult templateId={templateId} /></BoothShell>;
}
