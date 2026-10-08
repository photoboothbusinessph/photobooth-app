import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

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
