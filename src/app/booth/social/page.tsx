import { BoothShell } from "@/components/layout/booth-shell";
import { SocialResult } from "@/components/booth/social-result";

export default function SocialPage() {
  return <BoothShell title="One last thing" eyebrow="Thanks for visiting" backHref="/booth/photo-qr"><SocialResult /></BoothShell>;
}
