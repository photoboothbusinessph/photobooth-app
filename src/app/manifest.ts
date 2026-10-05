import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receipt Photobooth",
    short_name: "Receipt Booth",
    description: "A touch-first receipt photobooth for events and businesses.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#7C00FF",
    theme_color: "#7C00FF",
    icons: [
      { src: "/icons/photobooth.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/photobooth.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
