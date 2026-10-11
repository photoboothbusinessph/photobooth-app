import { redirect } from "next/navigation";
import { BoothExperience } from "@/components/booth/booth-experience";
import { getBusinessBySlug } from "@/lib/db/tenant";

export default async function BusinessBoothPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await getBusinessBySlug(slug))) redirect("/");
  return <BoothExperience />;
}
