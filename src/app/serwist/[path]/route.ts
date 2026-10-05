import { createSerwistRoute } from "@serwist/turbopack";

const precacheRevision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? `local-${Date.now()}`;

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  additionalPrecacheEntries: [
    { url: "/~offline", revision: precacheRevision },
    { url: "/", revision: precacheRevision },
    { url: "/booth/templates", revision: precacheRevision },
    { url: "/booth/camera", revision: precacheRevision },
    { url: "/booth/preview", revision: precacheRevision },
    { url: "/booth/photo-qr", revision: precacheRevision },
    { url: "/booth/social", revision: precacheRevision },
    { url: "/admin", revision: precacheRevision },
  ],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
