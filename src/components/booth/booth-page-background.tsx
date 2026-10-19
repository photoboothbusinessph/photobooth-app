"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBusinessStore } from "@/stores/business-store";
import type { BoothPageBackgroundKey } from "@/types";

const routeBackgrounds: Record<string, BoothPageBackgroundKey> = {
  templates: "layout",
  camera: "camera",
  designs: "design",
  preview: "preview",
  "photo-qr": "qr",
  social: "qr",
};

export function BoothPageBackground() {
  const pathname = usePathname();
  const routeStep = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const key = routeBackgrounds[routeStep];
  const asset = useBusinessStore((state) => key ? state.boothPageBackgrounds[key] : undefined);

  if (!asset) return null;
  return <Image src={asset.url} alt="" fill priority unoptimized sizes="100vw" className="pointer-events-none object-cover" />;
}
