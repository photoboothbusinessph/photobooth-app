import "server-only";
import { getCollections } from "@/lib/db/collections";

export function templateDocumentId(businessId: string, templateId: string) {
  return businessId === "default" ? templateId : `${businessId}__${templateId}`;
}

export function templatePublicId(businessId: string, documentId: string) {
  return businessId === "default" ? documentId : documentId.slice(`${businessId}__`.length);
}

export async function getBusinessBySlug(slug: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)) return null;
  const { businesses } = await getCollections();
  return businesses.findOne({ slug });
}

export async function getLegacyBusinessSlug() {
  const { businesses } = await getCollections();
  const business =
    await businesses.findOne({ _id: "default" }, { projection: { slug: 1 } }) ??
    await businesses.findOne(
      { slug: { $type: "string" }, isConfigured: true },
      { projection: { slug: 1 }, sort: { _id: 1 } },
    ) ??
    await businesses.findOne(
      { slug: { $type: "string" } },
      { projection: { slug: 1 }, sort: { _id: 1 } },
    );
  return business?.slug ?? null;
}
