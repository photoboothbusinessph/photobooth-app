import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("RawBT raster encodes black, white and transparent pixels with valid framing and copies", async () => {
  const { encodeRaster, rawbtUri } = await loadModule("src/lib/receipt/rawbt.ts");
  const black = new Uint8ClampedArray(8 * 4);
  for (let i = 3; i < black.length; i += 4) black[i] = 255;
  const raster = encodeRaster(black, 8, 1);
  assert.deepEqual([...raster], [29, 118, 48, 0, 1, 0, 1, 0, 255]);
  assert.equal(encodeRaster(new Uint8ClampedArray(32), 8, 1)[8], 0);
  assert.equal(encodeRaster(new Uint8ClampedArray(32).fill(255), 8, 1)[8], 0);
  const uri = rawbtUri(raster, 2);
  assert.ok(uri.startsWith("rawbt:base64,"));
  const bytes = Buffer.from(uri.slice("rawbt:base64,".length), "base64");
  const expected = [27, 64, 27, 97, 1, ...raster, 27, 100, 3, 29, 86, 1];
  assert.deepEqual([...bytes], [...expected, ...expected]);
  assert.throws(() => encodeRaster(black, 7, 1), /dimensions/);
  for (const copies of [0, 10, 1.5]) assert.throws(() => rawbtUri(raster, copies), /copies/);
  assert.throws(() => rawbtUri(new Uint8Array(115208), 9), /Reduce Copies/);
  for (const height of [800, 1200, 1600]) {
    const full = encodeRaster(new Uint8ClampedArray(576 * height * 4), 576, height);
    assert.equal(full.length, 8 + 72 * height);
    assert.equal(full[6] + 256 * full[7], height);
    assert.ok(rawbtUri(full, 1).length < 300000);
  }
});

test("booth Print hands off directly to RawBT without WebUSB or confirmation", async () => {
  const previewStudio = await readFile("src/components/booth/preview-studio.tsx", "utf8");
  assert.match(previewStudio, /async function openPrint[\s\S]*await openRawbt\(\)/);
  assert.doesNotMatch(previewStudio, /webusb|navigator\.usb|window\.confirm/i);
});

test("receipt sizes and photo boxes follow the tablet receipt rules", async () => {
  const { normalizeReceiptTemplate, receiptSizeForSlots, receiptSlotRects } = await loadModule("src/lib/receipt/template-rules.ts");
  assert.deepEqual([1, 2, 3, 4].map(receiptSizeForSlots), ["80 × 100 mm", "80 × 150 mm", "80 × 150 mm", "80 × 200 mm"]);
  const normalized = normalizeReceiptTemplate({ photoSlots: 4, size: "80 × 260 mm" });
  assert.equal(normalized.size, "80 × 200 mm");
  const rectangles = receiptSlotRects(4, 800, 2000);
  assert.equal(rectangles.length, 4);
  assert.ok(rectangles.every((rectangle) => rectangle.x === rectangles[0].x && rectangle.width === rectangles[0].width));
  assert.ok(rectangles.every((rectangle, index) => index === 0 || rectangle.y > rectangles[index - 1].y));
});

test("new devices sign in first; paired devices see welcome", async () => {
  const state = { admin: null, paired: false };
  globalThis.pairingAccessTest = state;
  const replacements = {
    "next/navigation": `export function redirect(path) { throw new Error("redirect:" + path); } export function notFound() { throw new Error("not-found"); }`,
    "@/lib/db/tenant": `export const getBusinessBySlug = async () => ({ _id: "business-a", branding: { name: "Alpha" } });`,
    "@/lib/auth/session": `export async function requireBusinessAdmin() { if (!globalThis.pairingAccessTest.admin) throw new Error("Unauthorized"); return globalThis.pairingAccessTest.admin; }`,
    "@/lib/auth/kiosk": `export async function requireKiosk() { if (!globalThis.pairingAccessTest.paired) throw new Error("Unauthorized"); return {}; }`,
    "@/components/booth/booth-experience": `export function BoothExperience() { return null; }`,
    "@/components/booth/kiosk-pair-form": `export function KioskPairForm() { return null; }`,
  };
  try {
    const { default: welcome } = await loadModule("src/app/b/[slug]/page.tsx", replacements);
    const { default: pair } = await loadModule("src/app/b/[slug]/pair/page.tsx", replacements);
    const { default: step } = await loadModule("src/app/b/[slug]/booth/[step]/page.tsx", replacements);
    const props = { params: Promise.resolve({ slug: "alpha", step: "templates" }) };
    await assert.rejects(welcome(props), /redirect:\/admin\/login\?business=alpha$/);
    await assert.rejects(pair(props), /redirect:\/b\/alpha$/);
    await assert.rejects(step(props), /redirect:\/b\/alpha$/);
    state.admin = { businessId: "business-b" };
    await assert.rejects(pair(props), /redirect:\/b\/alpha$/);
    state.admin = { businessId: "business-a" };
    assert.ok(await pair(props));
    state.paired = true;
    await assert.rejects(pair(props), /redirect:\/b\/alpha$/);
    assert.ok(await welcome(props));
    assert.ok(await step(props));
  } finally { delete globalThis.pairingAccessTest; }
});

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
      export class CacheFirst { constructor(options) { Object.assign(this, options); } }
      export class NetworkOnly {}
      export class NetworkFirst { constructor(options) { Object.assign(this, options); } }
      export class Serwist { constructor(options) { globalThis.workerTestOptions = options; } addEventListeners() {} }
    `,
  });
  try {
    const config = globalThis.workerTestOptions;
    assert.equal(config.precacheOptions?.navigateFallback, undefined);
    const assetCache = config.runtimeCaching[0];
    assert.equal(assetCache.handler.cacheName, "business-image-assets-v1");
    assert.equal(assetCache.matcher({ url: new URL("https://res.cloudinary.com/demo/image.png"), request: { destination: "image" } }), true);
    assert.equal(assetCache.matcher({ url: new URL("https://other.test/image.png"), request: { destination: "image" } }), false);
    for (const path of ["/api/kiosks/status", "/api/business", "/admin", "/share/token", "/b/alpha/pair"]) {
      assert.equal(config.runtimeCaching[1].matcher({ url: new URL(path, "https://booth.test"), sameOrigin: true }), true);
    }
    const route = config.runtimeCaching[2];
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
