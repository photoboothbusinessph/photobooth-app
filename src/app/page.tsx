import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slug = await getLegacyBusinessSlug();
  redirect(slug ? `/admin/login?business=${encodeURIComponent(slug)}` : "/admin/login");
}
