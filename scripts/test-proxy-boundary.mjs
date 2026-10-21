import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";

test("the deployment proxy does not bundle database or Node-only infrastructure", async () => {
  const result = await build({
    entryPoints: ["src/proxy.ts"],
    bundle: true,
    write: false,
    metafile: true,
    platform: "browser",
    format: "esm",
    plugins: [{
      name: "next-runtime",
      setup(builder) {
        builder.onResolve({ filter: /^next\/server$/ }, ({ path }) => ({ path, external: true }));
      },
    }],
  });
  const inputs = Object.keys(result.metafile.inputs).join("\n");
  assert.doesNotMatch(inputs, /mongodb|cloudinary|src[\\/]lib[\\/]db|src[\\/]lib[\\/]server/);
  assert.match(inputs, /session-token\.ts/);
});

test("the environment example does not contain scannable secret placeholders", async () => {
  const example = await readFile(".env.example", "utf8");
  const values = Object.fromEntries(example.trim().split(/\r?\n/).map((line) => line.split("=", 2)));
  for (const key of [
    "MONGODB_URI",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "AUTH_SECRET",
    "SUPER_ADMIN_USERNAME",
    "SUPER_ADMIN_PASSWORD",
    "MIGRATION_FIRST_BUSINESS_SLUG",
  ]) assert.equal(values[key], "", `${key} must be blank in .env.example`);
});

test("runtime services validate only their own environment variables", async () => {
  const [databaseClient, cloudinaryClient, adminSession] = await Promise.all([
    readFile("src/lib/db/mongodb.ts", "utf8"),
    readFile("src/lib/cloudinary/client.ts", "utf8"),
    readFile("src/lib/auth/session.ts", "utf8"),
  ]);

  assert.match(databaseClient, /getDatabaseEnvironment/);
  assert.doesNotMatch(databaseClient, /getCloudinaryEnvironment|getApplicationEnvironment/);
  assert.match(cloudinaryClient, /getCloudinaryEnvironment/);
  assert.doesNotMatch(cloudinaryClient, /getDatabaseEnvironment|getApplicationEnvironment/);
  assert.match(adminSession, /getApplicationEnvironment/);
  assert.doesNotMatch(adminSession, /getDatabaseEnvironment|getCloudinaryEnvironment/);
});

test("existing admin login does not depend on bootstrap configuration", async () => {
  const loginRoute = await readFile("src/app/api/auth/login/route.ts", "utf8");
  const existingAdminGuard = loginRoute.indexOf("if (!admin &&");
  const bootstrapRead = loginRoute.indexOf("getSuperAdminBootstrapEnvironment()", existingAdminGuard);

  assert.notEqual(existingAdminGuard, -1);
  assert.ok(bootstrapRead > existingAdminGuard, "bootstrap environment must be read only after confirming the admin is absent");
});

test("admin authentication uses usernames while retaining legacy account lookup", async () => {
  const [loginRoute, loginForm, adminRoute, collections] = await Promise.all([
    readFile("src/app/api/auth/login/route.ts", "utf8"),
    readFile("src/components/admin/login-form.tsx", "utf8"),
    readFile("src/app/api/super-admin/admins/route.ts", "utf8"),
    readFile("src/lib/db/collections.ts", "utf8"),
  ]);

  assert.match(loginRoute, /username:\s*z\.string/);
  assert.match(loginRoute, /username: \{ \$exists: false \}, email: username/);
  assert.match(loginForm, /name="username"/);
  assert.doesNotMatch(loginForm, /name="email"|type="email"/);
  assert.match(adminRoute, /input\.username/);
  assert.match(collections, /createIndex\(\s*\{ username: 1 \}/);
});

test("business admins can copy pairing codes and revoke or delete their own kiosks", async () => {
  const [kioskRoute, kioskManager] = await Promise.all([
    readFile("src/app/api/admin/kiosks/[id]/route.ts", "utf8"),
    readFile("src/components/admin/business-kiosk-manager.tsx", "utf8"),
  ]);

  assert.match(kioskRoute, /export async function PATCH/);
  assert.match(kioskRoute, /updateOne\(\{ _id: id, businessId \}/);
  assert.match(kioskRoute, /export async function DELETE/);
  assert.match(kioskRoute, /deleteOne\(\{ _id: id, businessId \}\)/);
  assert.match(kioskManager, /navigator\.clipboard\.writeText\(code\)/);
  assert.match(kioskManager, /> Copy code</);
  assert.match(kioskManager, /Permanently delete device\?/);
});

test("legacy booth routes fall back to a configured tenant", async () => {
  const tenantRepository = await readFile("src/lib/db/tenant.ts", "utf8");
  assert.match(tenantRepository, /isConfigured: true/);
  assert.match(tenantRepository, /sort: \{ _id: 1 \}/);
});

test("public share tokens resolve the business from their session", async () => {
  const [sharePage, shareRepository] = await Promise.all([
    readFile("src/app/share/[token]/page.tsx", "utf8"),
    readFile("src/lib/share/public-share-data.ts", "utf8"),
  ]);

  assert.match(sharePage, /getPublicShareData\(token\)/);
  assert.match(shareRepository, /sessions\.findOne\(\{ shareToken: token \}\)/);
  assert.match(shareRepository, /businesses\.findOne\(\{ _id: session\.businessId \}\)/);
  assert.doesNotMatch(shareRepository, /businessId:\s*["']default["']/);
});

test("starter templates are persisted once and remain editable or deletable", async () => {
  const [catalog, templateRoute, manager] = await Promise.all([
    readFile("src/lib/receipt/starter-template-catalog.ts", "utf8"),
    readFile("src/app/api/templates/route.ts", "utf8"),
    readFile("src/components/admin/template-manager.tsx", "utf8"),
  ]);

  assert.match(catalog, /template\.builtIn/);
  assert.match(catalog, /\$setOnInsert/);
  assert.match(catalog, /templateCatalogVersion/);
  assert.match(templateRoute, /await ensureStarterTemplateCatalog\(businessId\)/);
  assert.doesNotMatch(templateRoute, /missingBuiltIns/);
  assert.doesNotMatch(manager, /template\.builtIn\s*\?\s*null\s*:\s*<DropdownMenu/);
  assert.match(manager, /Actions for \$\{template\.name\}/);
  assert.match(manager, /useState<1 \| 2 \| 3 \| 4>\(1\)/);
  assert.match(manager, /template\?\.photoSlots \?\? 1/);
  assert.match(manager, /minimum format is 800×1000px \/ 80×100 mm/);
});

test("super admin account actions stay protected and use confirmation dialogs", async () => {
  const [accountRoute, kioskRoute, businessRoute, businessDeletion, consoleUi] = await Promise.all([
    readFile("src/app/api/super-admin/admins/[id]/route.ts", "utf8"),
    readFile("src/app/api/super-admin/kiosks/[id]/route.ts", "utf8"),
    readFile("src/app/api/super-admin/businesses/[id]/route.ts", "utf8"),
    readFile("src/lib/super-admin/delete-business.ts", "utf8"),
    readFile("src/components/admin/super-admin-console.tsx", "utf8"),
  ]);

  assert.match(accountRoute, /export async function DELETE/);
  assert.match(accountRoute, /await requireSuperAdmin\(\)/);
  assert.match(accountRoute, /deleteOne\(\{ _id: id, role: "business_admin" \}\)/);
  assert.match(accountRoute, /\$inc: \{ sessionVersion: 1 \}/);
  assert.match(consoleUi, /<Dialog open=\{Boolean\(temporaryPassword\)\}/);
  assert.match(consoleUi, /navigator\.clipboard\.writeText\(temporaryPassword\)/);
  assert.match(consoleUi, /> Copy password<\/Button>/);
  assert.match(consoleUi, /<Dialog open=\{Boolean\(accountConfirmation\)\}/);
  assert.match(consoleUi, /Permanently delete account\?/);
  assert.match(kioskRoute, /export async function PATCH/);
  assert.match(kioskRoute, /export async function DELETE/);
  assert.match(kioskRoute, /await requireSuperAdmin\(\)/);
  assert.match(kioskRoute, /kioskDevices\.deleteOne/);
  assert.match(businessRoute, /await requireSuperAdmin\(\)/);
  assert.match(businessRoute, /deleteBusinessPermanently/);
  assert.match(businessDeletion, /admins\.deleteMany/);
  assert.match(businessDeletion, /kioskDevices\.deleteMany/);
  assert.match(businessDeletion, /sessions\.deleteMany/);
  assert.match(businessDeletion, /templates\.deleteMany/);
  assert.match(consoleUi, /<Dialog open=\{Boolean\(kioskConfirmation\)\}/);
  assert.match(consoleUi, /<Dialog open=\{Boolean\(businessDeleteTarget\)\}/);
});

test("booth page backgrounds enforce tenant ownership and business cleanup", async () => {
  const [businessRoute, schemas, deletion] = await Promise.all([
    readFile("src/app/api/business/route.ts", "utf8"),
    readFile("src/lib/validation/schemas.ts", "utf8"),
    readFile("src/lib/super-admin/delete-business.ts", "utf8"),
  ]);

  assert.match(schemas, /boothPageBackgrounds: z\.object/);
  assert.match(schemas, /"booth-page-background"/);
  assert.match(businessRoute, /Object\.values\(input\.boothPageBackgrounds \?\? \{\}\)/);
  assert.match(businessRoute, /isBusinessAsset\(asset\.publicId, businessId\)/);
  assert.match(deletion, /Object\.values\(business\.boothPageBackgrounds \?\? \{\}\)/);
});

test("receipt sync bypasses serverless image payload limits with signed direct uploads", async () => {
  const [syncClient, signatureRoute, sessionRoute, schemas, preview] = await Promise.all([
    readFile("src/lib/sync/client-sync.ts", "utf8"),
    readFile("src/app/api/sessions/upload-signature/route.ts", "utf8"),
    readFile("src/app/api/sessions/route.ts", "utf8"),
    readFile("src/lib/validation/schemas.ts", "utf8"),
    readFile("src/components/booth/preview-studio.tsx", "utf8"),
  ]);

  assert.match(syncClient, /\/api\/sessions\/upload-signature/);
  assert.match(syncClient, /new FormData\(\)/);
  assert.match(syncClient, /colorPublicId, bwPublicId/);
  assert.doesNotMatch(syncClient, /colorImage: session\.colorImage/);
  assert.match(signatureRoute, /await requireKiosk\(slug\)/);
  assert.match(signatureRoute, /createSignedSessionUpload/);
  assert.match(sessionRoute, /expectedColorPublicId/);
  assert.match(sessionRoute, /getCloudinaryImageUrl/);
  assert.match(schemas, /sessionUploadSignatureSchema/);
  assert.doesNotMatch(preview, /Save receipt and open QR page|Open QR page/);
});

test("admin settings persist the booth session timer for online and offline sessions", async () => {
  const [settings, provider, syncClient, schema, countdown, start] = await Promise.all([
    readFile("src/components/admin/settings-form.tsx", "utf8"),
    readFile("src/components/providers/offline-data-provider.tsx", "utf8"),
    readFile("src/lib/sync/client-sync.ts", "utf8"),
    readFile("src/lib/validation/schemas.ts", "utf8"),
    readFile("src/components/booth/session-countdown.tsx", "utf8"),
    readFile("src/components/booth/start-session-button.tsx", "utf8"),
  ]);

  assert.match(settings, /Booth session timer/);
  assert.match(settings, /cacheBusinessSettings/);
  assert.match(settings, /queueSync\("business", "default"\)/);
  assert.match(provider, /setBoothSessionDurationSeconds/);
  assert.match(syncClient, /boothSessionDurationSeconds/);
  assert.match(schema, /boothSessionDurationSeconds: z\.number\(\)\.int\(\)\.min\(60\)\.max\(3600\)/);
  assert.match(countdown, /normalizeBoothSessionDurationSeconds\(boothSessionDurationSeconds\)/);
  assert.match(start, /createBoothSessionDeadline\(boothSessionDurationSeconds\)/);
});
