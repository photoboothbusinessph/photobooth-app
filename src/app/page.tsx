import { WelcomeScreen } from "@/components/booth/welcome-screen";
import { redirect } from "next/navigation";
import { getLegacyBusinessSlug } from "@/lib/db/tenant";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slug = await getLegacyBusinessSlug();
  if (slug) redirect(`/b/${slug}`);
  return <WelcomeScreen />;
}
