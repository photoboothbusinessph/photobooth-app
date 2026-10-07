/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  disableDevLogs: true,
  runtimeCaching: [
    { matcher: ({ url, sameOrigin }) => sameOrigin && /^\/(?:admin|super-admin|share)(?:\/|$)/.test(url.pathname), handler: new NetworkOnly() },
    ...defaultCache,
  ],
  precacheOptions: {
    navigateFallback: "/~offline",
    navigateFallbackDenylist: [/^\/api\//, /^\/admin(?:\/|$)/, /^\/super-admin(?:\/|$)/, /^\/share(?:\/|$)/],
  },
  fallbacks: {
    entries: [{
      url: "/~offline",
      matcher({ request }) {
        return request.destination === "document";
      },
    }],
  },
});

serwist.addEventListeners();
