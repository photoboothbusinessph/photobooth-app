import { createSerwistRoute } from "@serwist/turbopack";

const precacheRevision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? `local-${Date.now()}`;

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
  additionalPrecacheEntries: [
    { url: "/~offline", revision: precacheRevision },
  ],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
