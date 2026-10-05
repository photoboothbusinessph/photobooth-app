"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useBusinessStore } from "@/stores/business-store";
import type { BusinessBranding } from "@/types";

export function BrandMark({
  className,
  inverse = false,
  label,
  logoUrl,
  branding,
  inheritColor = false,
}: {
  className?: string;
  inverse?: boolean;
  label?: string;
  logoUrl?: string | null;
  branding?: BusinessBranding;
  inheritColor?: boolean;
}) {
  const storedBranding = useBusinessStore((state) => state.branding);
  const activeBranding = branding ?? storedBranding;
  const monogram = label?.trim() || activeBranding.monogram.trim() || "YB";
  const logo = logoUrl === undefined ? activeBranding.logoDataUrl : logoUrl;
  const imageMode = (activeBranding.logoMode ?? (logo ? "image" : "text")) === "image";
  const font = activeBranding.logoFont ?? "editorial";
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center text-3xl leading-none",
        font === "editorial" ? "display-serif tracking-[-0.12em]" : font === "mono" ? "font-mono tracking-[-0.08em]" : "font-sans font-black tracking-[-0.06em]",
        !inheritColor && (inverse ? "text-white" : "text-black"),
        className,
      )}
      style={!imageMode && activeBranding.logoColor ? { color: activeBranding.logoColor } : undefined}
      aria-label={activeBranding.name}
    >
      {imageMode && logo ? (
        <span className="relative inline-block h-[1.3em] w-[3em] bg-white"><Image src={logo} alt={`${activeBranding.name} logo`} fill unoptimized sizes="(max-width: 768px) 180px, 440px" className="object-contain p-[0.08em]" /></span>
      ) : (
        <span className="whitespace-pre-wrap">{monogram}</span>
      )}
    </div>
  );
}
