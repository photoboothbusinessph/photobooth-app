import Image from "next/image";
import { BrandMark } from "@/components/shared/brand-mark";
import { boothImages } from "@/config/mock-data";
import { cn } from "@/lib/utils";
import type { BusinessBranding, CapturedPhoto, ReceiptTemplate, TemplateLayout, ThemePalette } from "@/types";

const slotCount: Record<TemplateLayout, number> = { single: 1, double: 2, triple: 3, quad: 4 };

export function ReceiptPreview({ template, layout, palette, photos, branding, monochrome = false, compact = false, printable = false, className }: { template?: ReceiptTemplate; layout?: TemplateLayout; palette?: ThemePalette; photos?: CapturedPhoto[]; branding?: BusinessBranding; monochrome?: boolean; compact?: boolean; printable?: boolean; className?: string }) {
  const activeLayout = layout ?? template?.layout ?? "double";
  const colors = palette ?? template?.palette ?? { primary: "#7C00FF", secondary: "#101010", background: "#F7F6F2", text: "#101010", accent: "#D8FF4F" };
  const count = slotCount[activeLayout];
  const receiptDimensions = template?.size.match(/(\d+)\D+(\d+)/);
  const receiptWidth = `${receiptDimensions?.[1] ?? "80"}mm`;
  const receiptHeight = `${receiptDimensions?.[2] ?? "180"}mm`;
  return (
    <article
      className={cn("receipt-shadow flex aspect-[2/3.35] w-full max-w-[310px] flex-col overflow-hidden border-2 border-black bg-white p-[5%] text-black", compact && "max-w-[180px] border", printable && "print-receipt", className)}
      style={{ backgroundColor: colors.background, color: colors.text, "--receipt-width": receiptWidth, "--receipt-height": receiptHeight } as React.CSSProperties}
      data-print-receipt={printable ? "true" : undefined}
      aria-label={`${count}-photo receipt preview`}
    >
      <header className="flex items-center justify-between gap-2 pb-[5%]">
        {template?.logoPlacement !== "bottom" ? <BrandMark branding={branding} inheritColor className={cn("text-[clamp(1rem,5vw,2rem)]", compact && "text-base")} /> : <span className="text-[8px] font-bold uppercase tracking-[0.18em]">Photo receipt</span>}
        <span className="text-[8px] font-bold uppercase tracking-[0.22em]">Receipt No. 0928</span>
      </header>
      <div className={cn("grid min-h-0 flex-1 gap-1.5", activeLayout === "single" && "grid-rows-1", activeLayout === "double" && "grid-rows-2", activeLayout === "triple" && "grid-rows-3", activeLayout === "quad" && "grid-cols-2 grid-rows-2")}>
        {Array.from({ length: count }, (_, index) => (
          <div className="relative min-h-0 overflow-hidden bg-neutral-200" key={index}>
            <Image src={photos?.[index]?.dataUrl ?? boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" unoptimized={Boolean(photos?.[index])} className={cn("object-cover", monochrome && "grayscale")} priority={index === 0} />
            <span className="absolute bottom-1 right-1 bg-black px-1 py-0.5 text-[7px] font-bold text-white">0{index + 1}</span>
          </div>
        ))}
      </div>
      <footer className="flex items-end justify-between gap-3 pt-[5%]">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.18em]">{branding?.footerText ?? "Keep the moment"}</p>
          <p className="mt-0.5 text-[7px] opacity-60">{new Intl.DateTimeFormat("en-PH").format(new Date())}</p>
        </div>
        {template?.logoPlacement === "bottom" ? <BrandMark branding={branding} inheritColor className={cn("text-lg", compact && "text-sm")} /> : <span className="size-3 rounded-full" style={{ backgroundColor: colors.primary }} />}
      </footer>
    </article>
  );
}
