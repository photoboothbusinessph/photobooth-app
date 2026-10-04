import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { PublicShare } from "@/components/share/public-share";
import { getCollections } from "@/lib/db/collections";
import { business as defaultBusiness } from "@/config/mock-data";

export const metadata: Metadata = { title: "Your photo receipt", robots: { index: false, follow: false } };

export default async function SharePage({ params }: PageProps<"/share/[token]">) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return <PublicShare data={null} />;
  let data: ComponentProps<typeof PublicShare>["data"] = null;
  try {
    const { sessions, businesses } = await getCollections();
    const [session, business] = await Promise.all([sessions.findOne({ shareToken: token, businessId: "default" }), businesses.findOne({ _id: "default" })]);
    if (session) data = { sessionId: session._id, colorImageUrl: session.colorImageUrl, bwImageUrl: session.bwImageUrl, createdAt: session.createdAt.toISOString(), branding: business?.branding ?? { ...defaultBusiness, logoDataUrl: null }, socialQrUrl: business?.socialQrUrl ?? null };
  } catch {}
  return <PublicShare data={data} />;
}
