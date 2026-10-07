import type { Metadata } from "next";
import { TenantViewBoundary } from "@/components/providers/tenant-view-boundary";

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => ({ manifest: `/b/${slug}/manifest.webmanifest` }));
}

export default async function BusinessBoothLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TenantViewBoundary slug={slug}>{children}</TenantViewBoundary>;
}
