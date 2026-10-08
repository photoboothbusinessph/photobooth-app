import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";

// Run the real modules with small infrastructure doubles; no customer database,
// browser profile, or network connection is touched.
async function loadModule(entry, replacements = {}) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: "node", format: "esm",
    plugins: [{
      name: "test-infrastructure",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          Object.hasOwn(replacements, path) ? { path, namespace: "fixture" } : undefined);
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({ contents: replacements[path], loader: "js" }));
      },
    }],
  });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}

test("booth navigation stays local, including Back/Finish; other routes use Next", async () => {
  const previousWindow = globalThis.window;
  const calls = [];
  globalThis.window = {
    location: { pathname: "/b/alpha", origin: "https://booth.test" },
    history: {
      pushState: (_state, _title, href) => calls.push(["push", href]),
      replaceState: (_state, _title, href) => calls.push(["replace", href]),
    },
    scrollTo: () => {},
  };
  try {
    const { useBoothRouter } = await loadModule("src/hooks/use-booth-router.ts", {
      react: "export const useMemo = (factory) => factory();",
      "next/navigation": "export const useRouter = () => ({ push: (href) => globalThis.window.nextCall = href, replace: (href) => globalThis.window.nextCall = href });",
    });
    const router = useBoothRouter();
    for (const step of ["templates", "camera", "preview", "photo-qr", "social"]) {
      router.push("/b/alpha/booth/" + step);
    }
    router.replace("/b/alpha");
    assert.equal(calls.length, 6);
    assert.equal(globalThis.window.nextCall, undefined);
    for (const href of ["/admin/login", "/b/beta", "/b/alpha/pair", "https://other.test/b/alpha"]) {
      router.push(href);
      assert.equal(globalThis.window.nextCall, href);
    }
    assert.equal(calls.length, 6);
  } finally { globalThis.window = previousWindow; }
});

test("draft recovery, tenant isolation, completed sessions and storage errors", async () => {
  const db = { drafts: new Map(), settings: new Map(), fail: false };
  globalThis.offlineTestDb = db;
  const { useBoothStore, flushBoothSessionPersistence } = await loadModule("src/stores/booth-store.ts", {
    "@/lib/db/indexed-db": `
      const db = globalThis.offlineTestDb;
      export const photoboothDb = {
        boothDrafts: {
          get: async (key) => db.drafts.get(key),
          put: async (value) => { if(db.fail) throw new Error("quota"); db.drafts.set(value.tenantKey, structuredClone(value)); },
          delete: async (key) => { db.drafts.delete(key); },
        },
        businessSettings: { get: async (key) => db.settings.get(key) },
      };
    `,
  });
  try {
    db.settings.set("alpha", { businessId: "business-a", identityVerified: true });
    await useBoothStore.getState().hydrateSession("alpha");
    assert.equal(useBoothStore.getState().isHydrated, true);
    useBoothStore.getState().startSession("alpha", "business-a");
    useBoothStore.getState().selectTemplate("solo");
    useBoothStore.getState().beginCapture();
    useBoothStore.getState().addCapturedPhoto("data:image/jpeg;base64,test");
    assert.equal(await flushBoothSessionPersistence(), true);
    const sessionId = useBoothStore.getState().sessionId;
    await useBoothStore.getState().hydrateSession("beta");
    assert.equal(useBoothStore.getState().sessionId, null);
    await useBoothStore.getState().hydrateSession("alpha");
    assert.equal(useBoothStore.getState().sessionId, sessionId);
    assert.equal(useBoothStore.getState().capturedPhotos.length, 1);
    useBoothStore.getState().completeSession();
    await flushBoothSessionPersistence();
    db.drafts.get("alpha").startedAt = Date.now() - 180_000;
    await useBoothStore.getState().hydrateSession("beta");
    await useBoothStore.getState().hydrateSession("alpha");
    assert.equal(useBoothStore.getState().step, "complete");
    db.settings.set("alpha", { businessId: "business-other", identityVerified: true });
    await useBoothStore.getState().hydrateSession("beta");
    await useBoothStore.getState().hydrateSession("alpha");
    assert.equal(useBoothStore.getState().sessionId, null);
    db.fail = true;
    useBoothStore.getState().startSession("alpha", "business-a");
    assert.equal(await flushBoothSessionPersistence(), false);
    assert.match(useBoothStore.getState().persistenceError, /storage/);
    await useBoothStore.getState().hydrateSession("beta");
    assert.equal(useBoothStore.getState().isHydrated, true);
  } finally { delete globalThis.offlineTestDb; }
});

test("worker caches only booth HTML, never redirects or RSC as documents", async () => {
  globalThis.self = {};
  await loadModule("src/app/sw.ts", {
    "@serwist/turbopack/worker": "export const defaultCache = [];",
    serwist: `
      export class NetworkOnly {}
      export class NetworkFirst { constructor(options) { Object.assign(this, options); } }
      export class Serwist { constructor(options) { globalThis.workerTestOptions = options; } addEventListeners() {} }
    `,
  });
  try {
    const config = globalThis.workerTestOptions;
    assert.equal(config.precacheOptions?.navigateFallback, undefined);
    for (const path of ["/api/kiosks/status", "/api/business", "/admin", "/share/token", "/b/alpha/pair"]) {
      assert.equal(config.runtimeCaching[0].matcher({ url: new URL(path, "https://booth.test"), sameOrigin: true }), true);
    }
    const route = config.runtimeCaching[1];
    const matches = (path, headers = { accept: "text/html" }) => route.matcher({
      url: new URL(path, "https://booth.test"), sameOrigin: true,
      request: new Request("https://booth.test" + path, { headers }),
    });
    assert.equal(matches("/b/alpha"), true);
    assert.equal(matches("/b/alpha/booth/camera"), true);
    for (const path of ["/admin", "/share/secret", "/b/alpha/pair", "/api/business"]) assert.equal(matches(path), false);
    assert.equal(matches("/b/alpha", { rsc: "1", accept: "text/x-component" }), false);
    const cacheResponse = route.handler.plugins[0].cacheWillUpdate;
    const valid = new Response("<html/>", { headers: { "content-type": "text/html" } });
    assert.equal(await cacheResponse({ response: valid }), valid);
    assert.equal(await cacheResponse({ response: { ok: true, redirected: true } }), null);
    assert.equal(await cacheResponse({ response: new Response("failed", { status: 500 }) }), null);
  } finally { delete globalThis.self; delete globalThis.workerTestOptions; }
});
