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
    "SUPER_ADMIN_EMAIL",
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

test("adaptive starter templates are persisted once and remain editable or deletable", async () => {
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
});
