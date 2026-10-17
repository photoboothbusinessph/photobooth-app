import Image from "next/image";
import { Bookmark, CircleUserRound, Heart, MessageCircle, MoreVertical, Plane, Send } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { boothImages } from "@/config/mock-data";
import { cn } from "@/lib/utils";
import { normalizeReceiptTemplate, receiptDesignSlotRects, receiptMillimeters, receiptSizeForSlots } from "@/lib/receipt/template-rules";
import type { BusinessBranding, CapturedPhoto, PhotoSlotCount, ReceiptDesignStyle, ReceiptTemplate, TemplateLayout, ThemePalette } from "@/types";

const slotCount: Record<TemplateLayout, PhotoSlotCount> = { single: 1, double: 2, triple: 3, quad: 4 };

function DesignDecoration({ style, branding, compact }: { style: ReceiptDesignStyle; branding?: BusinessBranding; compact: boolean }) {
  if (style === "calendar") return <>
    <div className="absolute inset-x-[6%] top-[3%] text-center"><BrandMark branding={branding} inheritColor className={cn("text-[clamp(0.8rem,4vw,1.8rem)]", compact && "text-xs")} /><p className="text-[5px] font-bold uppercase tracking-[0.16em]">Receipt Photobooth</p></div>
    <div className="absolute inset-x-[6%] bottom-[3%] h-[21%] border-t border-black pt-[2%] text-black"><div className="flex justify-between text-[7px] font-black uppercase"><span>Date:</span><span>Year: {new Date().getFullYear()}</span></div><div className="mt-[2%] grid grid-cols-7 gap-y-[5%] text-center text-[5px]"><b>S</b><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b><b>S</b>{Array.from({ length: 31 }, (_, index) => <span key={index}>{index + 1}</span>)}</div></div>
  </>;
  if (style === "social-post") return <>
    <div className="absolute inset-x-[6%] top-[5%] flex items-center gap-[3%] text-black"><CircleUserRound className="size-[10%]" /><span className="text-[7px] font-black uppercase">{branding?.name ?? "Receipt Photobooth"}</span><MoreVertical className="ml-auto size-[8%]" /></div>
    <div className="absolute inset-x-[6%] bottom-[4%] flex items-center gap-[5%] text-black"><Heart className="size-[8%] fill-black" /><MessageCircle className="size-[8%]" /><Send className="size-[8%]" /><Bookmark className="ml-auto size-[8%]" /></div>
  </>;
  if (style === "barcode") return <>
    <div className="absolute inset-x-[9%] top-[4%] text-center text-black"><BrandMark branding={branding} inheritColor className={cn("text-[clamp(0.8rem,4vw,1.8rem)]", compact && "text-xs")} /><p className="text-[5px] font-bold uppercase tracking-[0.14em]">Receipt Photobooth</p></div>
    <div className="absolute inset-x-[9%] bottom-[2.5%] h-[16%] text-center text-black"><p className="mb-[2%] text-[7px] font-black uppercase tracking-[0.04em]">God is good all the time</p><div className="h-[58%] bg-[repeating-linear-gradient(90deg,#000_0_1px,transparent_1px_3px,#000_3px_6px,transparent_6px_8px,#000_8px_10px,transparent_10px_13px)]" /><p className="mt-[1%] font-mono text-[5px] tracking-[0.18em]">0 35545 62336 78 1</p></div>
  </>;
  return <>
    <div className="absolute inset-x-[6%] top-[4%] text-center text-black"><BrandMark branding={branding} inheritColor className={cn("text-[clamp(0.8rem,4vw,1.8rem)]", compact && "text-xs")} /><p className="text-[5px] font-bold uppercase tracking-[0.14em]">Receipt Photobooth</p></div>
    <div className="absolute inset-x-0 bottom-0 h-[22%] border-t-2 border-black text-black"><div className="flex h-[20%] items-center justify-end gap-[2%] bg-black px-[5%] text-[6px] font-black uppercase tracking-[0.06em] text-white"><span>Manila</span><Plane className="size-[8%] fill-white" /><span>Canada</span></div><div className="grid h-[80%] grid-cols-[1.55fr_1fr]"><strong className="flex items-center justify-center whitespace-nowrap text-[clamp(0.8rem,5vw,1.8rem)]">MNL → CAD</strong><div className="relative flex items-center border-l border-dashed border-black px-[8%] pr-[18%] font-serif text-[6px] leading-tight"><span>Flight<br />of 2501<br /><br />date&nbsp;&nbsp; Seat<br />01&nbsp;&nbsp;&nbsp;&nbsp; 25A<br /><br />Departure<br />10:25 PM</span><span className="absolute inset-y-[6%] right-[5%] w-[8%] bg-[repeating-linear-gradient(90deg,#000_0_1px,transparent_1px_2px,#000_2px_4px,transparent_4px_6px)]" /></div></div></div>
  </>;
}

export function ReceiptPreview({ template, layout, photoSlots, palette, photos, branding, monochrome = false, mirrored = false, compact = false, printable = false, className }: { template?: ReceiptTemplate; layout?: TemplateLayout; photoSlots?: PhotoSlotCount; palette?: ThemePalette; photos?: CapturedPhoto[]; branding?: BusinessBranding; monochrome?: boolean; mirrored?: boolean; compact?: boolean; printable?: boolean; className?: string }) {
  const normalizedTemplate = template ? normalizeReceiptTemplate(template) : undefined;
  const activeLayout = layout ?? normalizedTemplate?.layout ?? "double";
  const count = photoSlots ?? slotCount[activeLayout];
  const colors = palette ?? normalizedTemplate?.palette ?? { primary: "#7C00FF", secondary: "#101010", background: "#F7F6F2", text: "#101010", accent: "#D8FF4F" };
  const dimensions = receiptMillimeters(receiptSizeForSlots(count));
  const style = normalizedTemplate?.designStyle ?? "classic";
  const overlayMode = normalizedTemplate?.designMode === "image-overlay" && normalizedTemplate.overlayImageUrl;
  const pixelHeight = dimensions.height * 10;
  const rects = receiptDesignSlotRects(style, count, 800, pixelHeight);
  const positioned = Boolean(overlayMode || style !== "classic");

  return (
    <article className={cn("receipt-shadow relative flex w-full max-w-[310px] flex-col overflow-hidden border-2 border-black bg-white text-black", !positioned && "p-[5%]", compact && "max-w-[180px] border", printable && "print-receipt", className)} style={{ aspectRatio: `${dimensions.width}/${dimensions.height}`, backgroundColor: colors.background, color: colors.text, "--receipt-width": `${dimensions.width}mm`, "--receipt-height": `${dimensions.height}mm` } as React.CSSProperties} data-print-receipt={printable ? "true" : undefined} aria-label={`${count}-photo ${normalizedTemplate?.name ?? "receipt"} preview`}>
      {positioned ? <>
        {rects.map((rect, index) => <div key={index} className="absolute overflow-hidden bg-neutral-200" style={{ left: `${rect.x / 8}%`, top: `${rect.y / pixelHeight * 100}%`, width: `${rect.width / 8}%`, height: `${rect.height / pixelHeight * 100}%` }}><Image src={photos?.[index]?.dataUrl ?? boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" unoptimized={Boolean(photos?.[index])} className={cn("object-cover", monochrome && "grayscale", mirrored && "-scale-x-100")} /></div>)}
        {overlayMode ? <Image src={normalizedTemplate.overlayImageUrl!} alt={`${normalizedTemplate.name} template artwork`} fill sizes="310px" unoptimized className="pointer-events-none object-fill" /> : <DesignDecoration style={style} branding={branding} compact={compact} />}
      </> : <>
        <header className="flex items-center justify-between gap-2 pb-[5%]">{template?.logoPlacement !== "bottom" ? <BrandMark branding={branding} inheritColor className={cn("text-[clamp(1rem,5vw,2rem)]", compact && "text-base")} /> : <span className="text-[8px] font-bold uppercase tracking-[0.18em]">Photo receipt</span>}<span className="text-[8px] font-bold uppercase tracking-[0.22em]">Receipt No. 0928</span></header>
        <div className="grid min-h-0 flex-1 gap-1.5" style={{ gridTemplateRows: `repeat(${count}, minmax(0, 1fr))` }}>{Array.from({ length: count }, (_, index) => <div className="relative min-h-0 overflow-hidden bg-neutral-200" key={index}><Image src={photos?.[index]?.dataUrl ?? boothImages[index % boothImages.length]} alt={`Photobooth frame ${index + 1}`} fill sizes="310px" unoptimized={Boolean(photos?.[index])} className={cn("object-cover", monochrome && "grayscale", mirrored && "-scale-x-100")} priority={index === 0} /><span className="absolute bottom-1 right-1 bg-black px-1 py-0.5 text-[7px] font-bold text-white">0{index + 1}</span></div>)}</div>
        <footer className="flex items-end justify-between gap-3 pt-[5%]"><div><p className="text-[8px] font-bold uppercase tracking-[0.18em]">{branding?.footerText ?? "Keep the moment"}</p><p className="mt-0.5 text-[7px] opacity-60">{new Intl.DateTimeFormat("en-PH").format(new Date())}</p></div>{template?.logoPlacement === "bottom" ? <BrandMark branding={branding} inheritColor className={cn("text-lg", compact && "text-sm")} /> : <span className="size-3 rounded-full" style={{ backgroundColor: colors.primary }} />}</footer>
      </>}
    </article>
  );
}
