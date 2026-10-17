import "server-only";
import { templates as starterTemplates } from "@/config/mock-data";
import { getCollections } from "@/lib/db/collections";
import { normalizeReceiptTemplate } from "@/lib/receipt/template-rules";
import { templateDocumentId } from "@/lib/db/tenant";

export const TEMPLATE_CATALOG_VERSION = 1;

export async function ensureStarterTemplateCatalog(businessId: string) {
  const { businesses, templates } = await getCollections();
  const business = await businesses.findOne(
    { _id: businessId },
    { projection: { templateCatalogVersion: 1 } },
  );
  if ((business?.templateCatalogVersion ?? 0) >= TEMPLATE_CATALOG_VERSION) return;

  const now = new Date();
  const adaptiveTemplates = starterTemplates.filter((template) => template.builtIn).map(normalizeReceiptTemplate);
  if (adaptiveTemplates.length) {
    await templates.bulkWrite(adaptiveTemplates.map(({ id, ...template }) => ({
      updateOne: {
        filter: { _id: templateDocumentId(businessId, id), businessId },
        update: { $setOnInsert: { ...template, createdAt: now, updatedAt: now } },
        upsert: true,
      },
    })));
  }
  await businesses.updateOne(
    { _id: businessId },
    { $set: { templateCatalogVersion: TEMPLATE_CATALOG_VERSION } },
  );
}
