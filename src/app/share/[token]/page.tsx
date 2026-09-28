import type { Metadata } from "next";
import { PublicShare } from "@/components/share/public-share";

export const metadata: Metadata = { title: "Your photo receipt", robots: { index: false, follow: false } };

export default async function SharePage({ params }: PageProps<"/share/[token]">) {
  const { token } = await params;
  return <PublicShare token={token} />;
}
