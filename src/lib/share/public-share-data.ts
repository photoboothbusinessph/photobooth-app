import "server-only";
import { business as defaultBusiness } from "@/config/mock-data";
import { getCollections } from "@/lib/db/collections";
import type { PublicShareData } from "@/types";

export const publicShareTokenPattern = /^[A-Za-z0-9_-]{32,64}$/;
export type PublicShareVariant = "color" | "bw";

export async function getPublicShareData(token: string): Promise<PublicShareData | null> {
  if (!publicShareTokenPattern.test(token)) return null;

  const { sessions, businesses } = await getCollections();
  const session = await sessions.findOne({ shareToken: token });
  if (!session) return null;

  const business = await businesses.findOne({ _id: session.businessId });
  return {
    sessionId: session._id,
    colorImageUrl: session.colorImageUrl,
    bwImageUrl: session.bwImageUrl,
    createdAt: session.createdAt.toISOString(),
    branding: business?.branding ?? { ...defaultBusiness, logoDataUrl: null },
    socialUrl: business?.socialUrl ?? null,
    socialQrUrl: business?.socialQrUrl ?? null,
  };
}

export async function getPublicShareDownloadAsset(token: string, variant: PublicShareVariant) {
  if (!publicShareTokenPattern.test(token)) return null;

  const { sessions } = await getCollections();
  const session = await sessions.findOne({ shareToken: token });
  if (!session) return null;

  return {
    publicId: variant === "color" ? session.colorPublicId : session.bwPublicId,
  };
}
