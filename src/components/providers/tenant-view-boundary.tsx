"use client";

import { useBusinessStore } from "@/stores/business-store";

export function TenantViewBoundary({ children, businessId, slug }: { children: React.ReactNode; businessId?: string; slug?: string }) {
  const activeBusinessId = useBusinessStore((state) => state.businessId);
  const activeTenantKey = useBusinessStore((state) => state.tenantKey);
  const hydrated = useBusinessStore((state) => state.isHydrated);
  const matches = slug ? activeTenantKey === slug : activeBusinessId === businessId;
  if (!hydrated) return <div role="status" className={slug ? "grid min-h-dvh place-items-center bg-neutral-950 p-5 font-bold text-white" : "grid min-h-dvh place-items-center bg-neutral-50 p-5 font-bold text-black"}>Loading this business…</div>;
  if (!matches) return <div role="alert" className={slug ? "grid min-h-dvh place-items-center bg-neutral-950 p-5 text-center text-white" : "grid min-h-dvh place-items-center bg-neutral-50 p-5 text-center text-black"}><div><p className="font-bold">This business could not be loaded.</p><p className="mt-2 text-sm">Check your connection or account access, then try again.</p><a href={slug ? `/b/${slug}` : "/admin"} className="mt-5 inline-flex min-h-11 items-center border border-current px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2">Try again</a></div></div>;
  return children;
}
