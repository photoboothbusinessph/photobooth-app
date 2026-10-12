import Image from "next/image";
import { BrandMark } from "@/components/shared/brand-mark";
import { boothImages } from "@/config/mock-data";
import { cn } from "@/lib/utils";
import { normalizeReceiptTemplate, receiptMillimeters, receiptSlotRects } from "@/lib/receipt/template-rules";
import type { BusinessBranding, CapturedPhoto, ReceiptTemplate, TemplateLayout, ThemePalette } from "@/types";

const slotCount: Record<TemplateLayout, number> = { single: 1, double: 2, triple: 3, quad: 4 };

export function ReceiptPreview({ template, layout, palette, photos, branding, monochrome = false, mirrored = false, compact = false, printable = false, className }: { template?: ReceiptTemplate; layout?: TemplateLayout; palette?: ThemePalette; photos?: CapturedPhoto[]; branding?: BusinessBranding; monochrome?: boolean; mirrored?: boolean; compact?: boolean; printable?: boolean; className?: string }) {
  const normalizedTemplate = template ? normalizeReceiptTemplate(template) : undefined;
  const activeLayout = layout ?? normalizedTemplate?.layout ?? "double";
  const colors = palette ?? normalizedTemplate?.palette ?? { primary: "#7C00FF", secondary: "#101010", background: "#F7F6F2", text: "#101010", accent: "#D8FF4F" };
  const count = slotCount[activeLayout];
  const dimensions = receiptMillimeters(normalizedTemplate?.size ?? "80 × 150 mm");
  const receiptWidth = `${dimensions.width}mm`;
  const receiptHeight = `${dimensions.height}mm`;
  const overlayMode = normalizedTemplate?.designMode === "image-overlay" && normalizedTemplate.overlayImageUrl;
  const pixelHeight = dimensions.height * 10;
  const rects = receiptSlotRects(count, 800, pixelHeight);
  return (
    <article
      className={cn("receipt-shadow relative flex w-full max-w-[310px] flex-col overflow-hidden border-2 border-black bg-white text-black", !overlayMode && "p-[5%]", compact && "max-w-[180px] border", printable && "print-receipt", className)}
      style={{ aspectRatio: `${dimensions.width}/${dimensions.height}`, backgroundColor: colors.background, color: colors.text, "--receipt-width": receiptWidth, "--receipt-height": receiptHeight } as React.CSSProperties}
      data-print-receipt={printable ? "true" : undefined}
      aria-label={`${count}-photo receipt preview`}
    >
      {overlayMode ? <>
        {rects.map((rect, index) => <div key={index} className="absolute overflow-hidden bg-neutral-200" style={{ left: `${rect.x / 8}%`, top: `${rect.y / pixelHeight * 100}%`, width: `${rect.width / 8}%`, height: `${rect.height / pixelHeight * 100}%` }}><Image src={photos?.[index]?.dataUrl ?? boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" unoptimized={Boolean(photos?.[index])} className={cn("object-cover", monochrome && "grayscale", mirrored && "-scale-x-100")} /></div>)}
        <Image src={normalizedTemplate.overlayImageUrl!} alt={`${normalizedTemplate.name} template artwork`} fill sizes="310px" unoptimized className="pointer-events-none object-fill" />
      </> : <>
      <header className="flex items-center justify-between gap-2 pb-[5%]">
        {template?.logoPlacement !== "bottom" ? <BrandMark branding={branding} inheritColor className={cn("text-[clamp(1rem,5vw,2rem)]", compact && "text-base")} /> : <span className="text-[8px] font-bold uppercase tracking-[0.18em]">Photo receipt</span>}
        <span className="text-[8px] font-bold uppercase tracking-[0.22em]">Receipt No. 0928</span>
      </header>
      <div className={cn("grid min-h-0 flex-1 gap-1.5", activeLayout === "single" && "grid-rows-1", activeLayout === "double" && "grid-rows-2", activeLayout === "triple" && "grid-rows-3", activeLayout === "quad" && "grid-rows-4")}>
        {Array.from({ length: count }, (_, index) => (
          <div className="relative min-h-0 overflow-hidden bg-neutral-200" key={index}>
            <Image src={photos?.[index]?.dataUrl ?? boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" unoptimized={Boolean(photos?.[index])} className={cn("object-cover", monochrome && "grayscale", mirrored && "-scale-x-100")} priority={index === 0} />
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
      </>}
    </article>
  );
}
