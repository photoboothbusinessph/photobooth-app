import type { Metadata } from "next";
import { PublicShare } from "@/components/share/public-share";
import { getPublicShareData } from "@/lib/share/public-share-data";

export const metadata: Metadata = { title: "Your photo receipt", robots: { index: false, follow: false } };

export default async function SharePage({ params }: PageProps<"/share/[token]">) {
  const { token } = await params;
  return <PublicShare data={await getPublicShareData(token)} />;
}
