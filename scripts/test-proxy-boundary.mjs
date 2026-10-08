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
