import "server-only";
import { deleteImage } from "@/lib/cloudinary/client";
import { isBusinessAsset } from "@/lib/cloudinary/ownership";
import { getCollections } from "@/lib/db/collections";
import { getMongoClient } from "@/lib/db/mongodb";

export async function deleteBusinessPermanently(businessId: string) {
  const { businesses, admins, kioskDevices, pairCodes, sessions, templates } = await getCollections();
  const business = await businesses.findOne({ _id: businessId });
  if (!business) return null;

  const [templateAssets, sessionAssets] = await Promise.all([
    templates.find({ businessId }, { projection: { overlayPublicId: 1 } }).toArray(),
    sessions.find({ businessId }, { projection: { colorPublicId: 1, bwPublicId: 1 } }).toArray(),
  ]);
  const publicIds = new Set([
    business.logoPublicId,
    business.socialQrPublicId,
    business.welcomeBackgroundPublicId,
    ...templateAssets.map((item) => item.overlayPublicId),
    ...sessionAssets.flatMap((item) => [item.colorPublicId, item.bwPublicId]),
  ].filter((value): value is string => Boolean(value && isBusinessAsset(value, businessId))));

  const mongoSession = (await getMongoClient()).startSession();
  let deletionCounts = { admins: 0, kiosks: 0, pairCodes: 0, sessions: 0, templates: 0 };
  try {
    await mongoSession.withTransaction(async () => {
      const adminResult = await admins.deleteMany({ businessId, role: "business_admin" }, { session: mongoSession });
      const kioskResult = await kioskDevices.deleteMany({ businessId }, { session: mongoSession });
      const pairCodeResult = await pairCodes.deleteMany({ businessId }, { session: mongoSession });
      const sessionResult = await sessions.deleteMany({ businessId }, { session: mongoSession });
      const templateResult = await templates.deleteMany({ businessId }, { session: mongoSession });
      const businessResult = await businesses.deleteOne({ _id: businessId }, { session: mongoSession });
      if (!businessResult.deletedCount) throw new Error("Business not found.");
      deletionCounts = {
        admins: adminResult.deletedCount,
        kiosks: kioskResult.deletedCount,
        pairCodes: pairCodeResult.deletedCount,
        sessions: sessionResult.deletedCount,
        templates: templateResult.deletedCount,
      };
    });
  } finally {
    await mongoSession.endSession();
  }

  await Promise.allSettled([...publicIds].map((publicId) => deleteImage(publicId)));
  return { deleted: true, ...deletionCounts };
}
