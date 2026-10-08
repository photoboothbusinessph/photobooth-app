/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

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
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && (
        /^\/(?:api|admin|super-admin|share)(?:\/|$)/.test(url.pathname)
        || /^\/b\/[a-z0-9-]+\/pair$/.test(url.pathname)
      ),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ url, request, sameOrigin }) => sameOrigin
        && /^\/b\/[a-z0-9-]+(?:\/booth\/(?:templates|camera|preview|photo-qr|social))?$/.test(url.pathname)
        && !request.headers.has("rsc")
        && (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html") === true),
      handler: new NetworkFirst({
        cacheName: "paired-booth-documents-v1",
        networkTimeoutSeconds: 3,
        plugins: [{
          cacheWillUpdate: async ({ response }) => response.ok && !response.redirected
            && response.headers.get("content-type")?.includes("text/html") ? response : null,
        }],
      }),
    },
    ...defaultCache,
  ],
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
