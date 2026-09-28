import Image from "next/image";
import { BrandMark } from "@/components/shared/brand-mark";
import { boothImages } from "@/config/mock-data";
import { cn } from "@/lib/utils";
import type { ReceiptTemplate, TemplateLayout, ThemePalette } from "@/types";

const slotCount: Record<TemplateLayout, number> = { single: 1, double: 2, triple: 3, quad: 4 };

export function ReceiptPreview({ template, layout, palette, monochrome = false, compact = false, className }: { template?: ReceiptTemplate; layout?: TemplateLayout; palette?: ThemePalette; monochrome?: boolean; compact?: boolean; className?: string }) {
  const activeLayout = layout ?? template?.layout ?? "double";
  const colors = palette ?? template?.palette ?? { primary: "#7C00FF", secondary: "#101010", background: "#F7F6F2", text: "#101010", accent: "#D8FF4F" };
  const count = slotCount[activeLayout];
  return (
    <article
      className={cn("receipt-shadow flex aspect-[2/3.35] w-full max-w-[310px] flex-col overflow-hidden border-2 border-black bg-white p-[5%] text-black", compact && "max-w-[180px] border", className)}
      style={{ backgroundColor: colors.background, color: colors.text }}
      aria-label={`${count}-photo receipt preview`}
    >
      <header className="flex items-center justify-between gap-2 pb-[5%]">
        {template?.logoPlacement !== "bottom" ? <BrandMark className={cn("text-[clamp(1rem,5vw,2rem)]", compact && "text-base")} /> : <span className="text-[8px] font-bold uppercase tracking-[0.18em]">Photo receipt</span>}
        <span className="text-[8px] font-bold uppercase tracking-[0.22em]">Receipt No. 0928</span>
      </header>
      <div className={cn("grid min-h-0 flex-1 gap-1.5", activeLayout === "single" && "grid-rows-1", activeLayout === "double" && "grid-rows-2", activeLayout === "triple" && "grid-rows-3", activeLayout === "quad" && "grid-cols-2 grid-rows-2")}>
        {Array.from({ length: count }, (_, index) => (
          <div className="relative min-h-0 overflow-hidden bg-neutral-200" key={index}>
            <Image src={boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" className={cn("object-cover", monochrome && "grayscale")} priority={index === 0} />
            <span className="absolute bottom-1 right-1 bg-black px-1 py-0.5 text-[7px] font-bold text-white">0{index + 1}</span>
          </div>
        ))}
      </div>
      <footer className="flex items-end justify-between gap-3 pt-[5%]">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em]">Keep the proof</p>
          <p className="mt-0.5 text-[7px] opacity-60">28 / 09 / 2026</p>
        </div>
        {template?.logoPlacement === "bottom" ? <BrandMark className={cn("text-lg", compact && "text-sm")} /> : <span className="size-3 rounded-full" style={{ backgroundColor: colors.primary }} />}
      </footer>
    </article>
  );
}
