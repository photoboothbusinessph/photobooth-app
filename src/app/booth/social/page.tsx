import { BoothShell } from "@/components/layout/booth-shell";
import { SocialResult } from "@/components/booth/social-result";

export default async function SocialPage({ searchParams }: PageProps<"/booth/social">) {
  const { template: templateParam } = await searchParams;
  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const backHref = templateId ? `/booth/photo-qr?template=${templateId}` : "/booth/photo-qr";

  return <BoothShell title="One last thing" eyebrow="Thanks for visiting" backHref={backHref} showCountdown={false}><SocialResult /></BoothShell>;
}
