import { MongoClient } from "mongodb";

const apply = process.argv.includes("--apply");
const dryRun = process.argv.includes("--dry-run");
const backupConfirmed = process.argv.includes("--backup-confirmed");
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;
const slug = process.env.MIGRATION_FIRST_BUSINESS_SLUG;

if ((apply === dryRun) || (apply && !backupConfirmed)) {
  throw new Error("Choose --dry-run or --apply --backup-confirmed. A verified backup is required before applying.");
}
if (!uri || !databaseName || !slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error("MONGODB_URI, MONGODB_DB, and a valid MIGRATION_FIRST_BUSINESS_SLUG are required.");
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const database = client.db(databaseName);
  const businesses = database.collection("businesses");
  const templates = database.collection("templates");
  const sessions = database.collection("sessions");
  const admins = database.collection("admins");
  const kiosks = database.collection("kioskDevices");
  const legacyBusiness = await businesses.findOne({ _id: "default" }, { projection: { _id: 1, slug: 1 } });
  if (!legacyBusiness) throw new Error("Legacy default business not found. No changes made.");
  if (legacyBusiness.slug && legacyBusiness.slug !== slug) throw new Error("Default business already uses a different slug. No changes made.");
  if (await businesses.findOne({ slug, _id: { $ne: "default" } }, { projection: { _id: 1 } })) throw new Error("Slug belongs to another business. No changes made.");

  const counts = {
    businessesToName: legacyBusiness.slug ? 0 : 1,
    templatesToScope: await templates.countDocuments({ businessId: { $exists: false } }),
    sessionsToScope: await sessions.countDocuments({ businessId: { $exists: false } }),
    adminsToScope: await admins.countDocuments({ role: { $exists: false } }),
    kiosksToScope: await kiosks.countDocuments({ businessId: { $exists: false } }),
  };
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", database: databaseName, slug, counts }, null, 2));
  if (apply) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const now = new Date();
        await businesses.updateOne({ _id: "default" }, { $set: { slug, updatedAt: now } }, { session });
        await templates.updateMany({ businessId: { $exists: false } }, { $set: { businessId: "default" } }, { session });
        await sessions.updateMany({ businessId: { $exists: false } }, { $set: { businessId: "default" } }, { session });
        await admins.updateMany({ role: { $exists: false } }, { $set: { role: "business_admin", businessId: "default", isEnabled: true, mustChangePassword: false, sessionVersion: 0, updatedAt: now } }, { session });
        await kiosks.updateMany({ businessId: { $exists: false } }, { $set: { businessId: "default" } }, { session });
      });
    } finally { await session.endSession(); }
    console.log("Migration applied. Existing session IDs and share tokens were not changed.");
  }
} finally { await client.close(); }
