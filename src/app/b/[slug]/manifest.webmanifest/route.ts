import { getBusinessBySlug } from "@/lib/db/tenant";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const business = await getBusinessBySlug(slug);
  if (!business) return new Response(null, { status: 404 });
  return Response.json({
    name: `${business.branding.name} Receipt Photobooth`,
    short_name: business.branding.name.slice(0, 24),
    description: "A touch-first receipt photobooth.",
    start_url: `/b/${slug}`,
    scope: `/b/${slug}`,
    display: "standalone",
    orientation: "any",
    background_color: business.palette.primary,
    theme_color: business.palette.primary,
    icons: [
      { src: "/icons/photobooth.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/photobooth.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "private, max-age=300" } });
}
