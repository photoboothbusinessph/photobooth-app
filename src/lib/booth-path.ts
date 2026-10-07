export function boothBasePath(pathname: string) {
  const match = pathname.match(/^\/b\/([a-z0-9-]+)/);
  return match ? `/b/${match[1]}` : "";
}

export function boothSlug(pathname: string) {
  return pathname.match(/^\/b\/([a-z0-9-]+)/)?.[1] ?? null;
}
