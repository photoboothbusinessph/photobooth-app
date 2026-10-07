import "server-only";

import { getCollections } from "@/lib/db/collections";
import { templateDocumentId } from "@/lib/db/tenant";

export async function getDashboardOverview(businessId: string) {
  const { sessions, templates } = await getCollections();
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentCount, syncedCount, recentSessions, businessTemplates] = await Promise.all([
    sessions.countDocuments({ businessId, createdAt: { $gte: last24Hours } }),
    sessions.countDocuments({ businessId }),
    sessions
      .find({ businessId }, { projection: { _id: 1, templateId: 1, createdAt: 1, syncStatus: 1 } })
      .sort({ createdAt: -1 })
      .limit(4)
      .toArray(),
    templates
      .find({ businessId }, { projection: { _id: 1, name: 1, isDefault: 1 } })
      .toArray(),
  ]);

  const templateNames = new Map(businessTemplates.map((template) => [template._id, template.name]));
  const activeTemplate = businessTemplates.find((template) => template.isDefault);

  return {
    recentCount,
    syncedCount,
    templateCount: businessTemplates.length,
    activeTemplateName: activeTemplate?.name ?? null,
    recentSessions: recentSessions.map((session) => ({
      id: session._id,
      createdAt: session.createdAt,
      templateName: templateNames.get(templateDocumentId(businessId, session.templateId)) ?? session.templateId,
      syncStatus: session.syncStatus,
    })),
  };
}
