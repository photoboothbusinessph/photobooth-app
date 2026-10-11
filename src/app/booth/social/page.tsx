import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export default async function SocialPage({ searchParams }: PageProps<"/booth/social">) {
  const { template: templateParam } = await searchParams;
  const templateId = Array.isArray(templateParam) ? templateParam[0] : templateParam;
  const query = templateId ? `?template=${encodeURIComponent(templateId)}` : "";
  const slug = await getLegacyBusinessSlug();
  redirect(slug ? `/b/${slug}/booth/photo-qr${query}` : `/booth/photo-qr${query}`);
}
