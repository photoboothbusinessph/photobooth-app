export const WELCOME_VIDEO_MAX_BYTES = 25 * 1024 * 1024;
export const WELCOME_VIDEO_MIME_TYPE = "video/mp4";
export const WELCOME_VIDEO_CACHE_NAME = "business-video-assets-v1";

export async function warmWelcomeVideoCache(url: string) {
  if (typeof window === "undefined" || !navigator.onLine || !("caches" in window)) return false;
  const request = new Request(url, { mode: "cors", credentials: "omit" });
  const response = await fetch(request);
  if (!response.ok) throw new Error("The welcome video could not be cached.");
  const cache = await caches.open(WELCOME_VIDEO_CACHE_NAME);
  await cache.put(request, response.clone());
  return true;
}

export async function removeWelcomeVideoFromCache(url: string | null) {
  if (!url || typeof window === "undefined" || !("caches" in window)) return false;
  const cache = await caches.open(WELCOME_VIDEO_CACHE_NAME);
  return cache.delete(url);
}
