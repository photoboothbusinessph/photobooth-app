"use client";

import * as React from "react";
import { Copy, Download, FileImage, LoaderCircle, MoreHorizontal, Pencil, Plus, Save, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activeTenantKey, cacheTemplates, photoboothDb, queueSync } from "@/lib/db/indexed-db";
import { detectTransparentSlotRects } from "@/lib/receipt/overlay-windows";
import { normalizeReceiptTemplate, overlayPixelsBySlots, receiptSizeForSlots, receiptSlotRects } from "@/lib/receipt/template-rules";
import { useBusinessStore } from "@/stores/business-store";
import type { ReceiptSlotRect, ReceiptTemplate, TemplateLayout } from "@/types";

const layoutOptions: { value: TemplateLayout; label: string; slots: 1 | 2 | 3 | 4 }[] = [
  { value: "single", label: "Single", slots: 1 }, { value: "double", label: "Double", slots: 2 }, { value: "triple", label: "Triple", slots: 3 }, { value: "quad", label: "Quad", slots: 4 },
];
const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

function TemplateColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="flex gap-2"><input id={id} type="color" value={isHexColor(value) ? value : "#101010"} onChange={(event) => onChange(event.target.value)} className="h-11 w-12 shrink-0 border p-1" /><Input aria-label={`${label} hex color`} value={value} maxLength={7} aria-invalid={!isHexColor(value)} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0" /></div>{!isHexColor(value) ? <p className="text-xs text-destructive">Use a six-digit hex color, such as #101010.</p> : null}</div>;
}

function freshTemplate(palette: ReceiptTemplate["palette"]): ReceiptTemplate {
  return { id: `custom-${Date.now()}`, name: "Untitled Template", layout: "double", photoSlots: 2, size: receiptSizeForSlots(2), isDefault: false, logoPlacement: "top", palette: { ...palette }, designMode: "generated" };
}

function layoutForSlots(slots: 1 | 2 | 3 | 4): TemplateLayout {
  return ({ 1: "single", 2: "double", 3: "triple", 4: "quad" } as const)[slots];
}

async function readOverlay(file: File, slots: 1 | 2 | 3 | 4) {
  if (file.type !== "image/png") throw new Error("Image templates must use a transparent PNG file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Choose a PNG smaller than 8 MB.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read the PNG."));
    reader.onerror = () => reject(new Error("Unable to read the PNG."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Unable to open the PNG."));
    element.src = dataUrl;
  });
  const expected = overlayPixelsBySlots[slots];
  if (image.naturalWidth !== expected.width || image.naturalHeight !== expected.height) throw new Error(`This layout requires a ${expected.width}×${expected.height}px PNG.`);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image validation is unavailable in this browser.");
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let transparent = false;
  for (let alpha = 3; alpha < pixels.length; alpha += 256) if (pixels[alpha] < 250) { transparent = true; break; }
  if (!transparent) throw new Error("The PNG must contain transparent photo windows.");
  return { dataUrl, slotRects: detectTransparentSlotRects(pixels, canvas.width, canvas.height, slots) };
}

function downloadExample(slots: 1 | 2 | 3 | 4) {
  const { width, height } = overlayPixelsBySlots[slots];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#7C00FF";
  context.fillRect(0, 0, width, height);
  receiptSlotRects(slots, width, height).forEach((rect) => context.clearRect(rect.x, rect.y, rect.width, rect.height));
  context.strokeStyle = "#ffffff";
  context.lineWidth = 5;
  receiptSlotRects(slots, width, height).forEach((rect) => context.strokeRect(rect.x, rect.y, rect.width, rect.height));
  context.fillStyle = "#ffffff";
  context.font = "48px serif";
  context.fillText("YOUR LOGO", 48, 78);
  context.font = "700 22px sans-serif";
  context.fillText("KEEP THE MOMENT", 48, height - 30);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${slots}-photo-overlay-example-${width}x${height}.png`;
  link.click();
}

export function TemplateManager() {
  const storedTemplates = useBusinessStore((state) => state.templates);
  const setStoredTemplates = useBusinessStore((state) => state.setTemplates);
  const businessPalette = useBusinessStore((state) => state.palette);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [imageEditorOpen, setImageEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ReceiptTemplate>(() => freshTemplate(useBusinessStore.getState().palette));
  const [deleteTarget, setDeleteTarget] = React.useState<ReceiptTemplate | null>(null);
  const [imageName, setImageName] = React.useState("Image Template");
  const [imageSlots, setImageSlots] = React.useState<1 | 2 | 3 | 4>(1);
  const [overlayDataUrl, setOverlayDataUrl] = React.useState<string | null>(null);
  const [overlaySlotRects, setOverlaySlotRects] = React.useState<ReceiptSlotRect[] | null>(null);
  const [overlayChanged, setOverlayChanged] = React.useState(false);
  const [editingImageTemplate, setEditingImageTemplate] = React.useState<ReceiptTemplate | null>(null);
  const [savingImage, setSavingImage] = React.useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const items = storedTemplates.map(normalizeReceiptTemplate);

  async function persist(next: ReceiptTemplate[], templateId: string, operation: "upsert" | "delete" = "upsert") {
    const normalized = next.map(normalizeReceiptTemplate);
    setStoredTemplates(normalized);
    await cacheTemplates(normalized);
    await queueSync("template", templateId, operation);
  }
  function openEditor(template?: ReceiptTemplate) { setDraft(template ? normalizeReceiptTemplate({ ...template, palette: { ...template.palette } }) : freshTemplate(businessPalette)); setEditorOpen(true); }
  function openImageEditor(template?: ReceiptTemplate) {
    setEditingImageTemplate(template ?? null);
    setImageName(template?.name ?? "Image Template");
    setImageSlots((template?.photoSlots ?? 1) as 1 | 2 | 3 | 4);
    setOverlayDataUrl(template?.overlayImageUrl ?? null);
    setOverlaySlotRects(template?.overlaySlotRects ?? null);
    setOverlayChanged(false);
    setImageEditorOpen(true);
  }
  async function saveDraft() {
    const normalized = normalizeReceiptTemplate(draft);
    const next = items.some((item) => item.id === normalized.id) ? items.map((item) => item.id === normalized.id ? normalized : item) : [...items, normalized];
    await persist(next, normalized.id);
    setEditorOpen(false);
    toast.success(navigator.onLine ? "Template saved and queued for sync" : "Template saved offline");
  }
  async function duplicate(template: ReceiptTemplate) {
    const copy = normalizeReceiptTemplate({ ...template, id: `${template.id}-copy-${crypto.randomUUID()}`, name: `${template.name} Copy`, isDefault: false });
    await persist([...items, copy], copy.id);
    toast.success("Template duplicated");
  }
  async function setDefault(id: string) {
    await persist(items.map((item) => ({ ...item, isDefault: item.id === id })), id);
    toast.success("Default template updated");
  }
  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const next = items.filter((item) => item.id !== target.id);
    setStoredTemplates(next);
    const tenantKey = activeTenantKey();
    if (!tenantKey) throw new Error("Business context unavailable.");
    await photoboothDb.cachedTemplates.delete(`${tenantKey}:${target.id}`);
    await queueSync("template", target.id, "delete");
    setDeleteTarget(null);
    toast.success(navigator.onLine ? "Template deletion queued" : "Template removed offline");
  }
  async function chooseOverlay(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const overlay = await readOverlay(file, imageSlots);
      setOverlayDataUrl(overlay.dataUrl);
      setOverlaySlotRects(overlay.slotRects);
      setOverlayChanged(true);
      toast.success("Template artwork is ready");
    } catch (error) {
      setOverlayDataUrl(null);
      setOverlaySlotRects(null);
      toast.error(error instanceof Error ? error.message : "Invalid image template.");
    }
  }
  async function saveImageTemplate() {
    if (!navigator.onLine) { toast.error("Connect to the internet to upload an image template."); return; }
    if (!imageName.trim() || !overlayDataUrl || !overlaySlotRects?.length) { toast.error("Enter a name and choose a compliant PNG."); return; }
    setSavingImage(true);
    let uploadedPublicId: string | null = null;
    try {
      let overlayImageUrl = editingImageTemplate?.overlayImageUrl ?? null;
      let overlayPublicId = editingImageTemplate?.overlayPublicId ?? null;
      if (overlayChanged || !editingImageTemplate) {
        const response = await fetch("/api/uploads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataUrl: overlayDataUrl, kind: "template-overlay", photoSlots: imageSlots }) });
        const result = await response.json() as { data?: { url: string; publicId: string }; error?: { message?: string } };
        if (!response.ok || !result.data) throw new Error(result.error?.message ?? "Template upload failed.");
        overlayImageUrl = result.data.url;
        overlayPublicId = result.data.publicId;
        uploadedPublicId = result.data.publicId;
      }
      const template = normalizeReceiptTemplate({ id: editingImageTemplate?.id ?? `image-${crypto.randomUUID()}`, name: imageName.trim(), layout: layoutForSlots(imageSlots), photoSlots: imageSlots, size: receiptSizeForSlots(imageSlots), isDefault: editingImageTemplate?.isDefault ?? false, logoPlacement: "top", palette: { ...businessPalette }, designMode: "image-overlay", overlayImageUrl, overlayPublicId, overlaySlotRects });
      await persist(items.some((item) => item.id === template.id) ? items.map((item) => item.id === template.id ? template : item) : [...items, template], template.id);
      setImageEditorOpen(false);
      setOverlayDataUrl(null);
      setOverlaySlotRects(null);
      setOverlayChanged(false);
      setEditingImageTemplate(null);
      setImageName("Image Template");
      toast.success("Image template saved");
    } catch (error) {
      if (uploadedPublicId) void fetch("/api/uploads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicId: uploadedPublicId }) });
      toast.error(error instanceof Error ? error.message : "Unable to save image template.");
    } finally { setSavingImage(false); }
  }

  return <>
    <div className="mb-6 flex flex-wrap justify-end gap-3"><Button variant="outline" onClick={() => openImageEditor()} className="h-11"><FileImage /> Add template using image</Button><Button onClick={() => openEditor()} className="h-11"><Plus /> Add template</Button></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{items.map((template) => <article key={template.id} className="flex h-full flex-col border border-black/15 bg-card p-4"><div className="flex h-72 shrink-0 items-center justify-center bg-muted p-5"><ReceiptPreview template={template} compact className="max-h-full shadow-[5px_6px_0_rgb(16_16_16/0.15)]" /></div><div className="mt-4 grid min-h-14 grid-cols-[minmax(0,1fr)_2.75rem] items-start gap-3"><div className="min-w-0"><div className="flex min-h-7 flex-wrap items-center gap-2"><h2 className="truncate font-bold">{template.name}</h2>{template.isDefault ? <Badge className="bg-primary text-primary-foreground"><Star className="size-3" /> Default</Badge> : null}{template.designMode === "image-overlay" ? <Badge variant="outline">Image</Badge> : null}{template.builtIn ? <Badge variant="outline">Built-in</Badge> : null}</div><p className="mt-1 text-xs text-muted-foreground">{template.photoSlots} slots · {template.size}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-11 self-start justify-self-end" aria-label={`Actions for ${template.name}`} />}><MoreHorizontal className="size-5" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => template.designMode === "image-overlay" ? openImageEditor(template) : openEditor(template)}><Pencil /> Edit</DropdownMenuItem>{template.designMode !== "image-overlay" ? <DropdownMenuItem onClick={() => void duplicate(template)}><Copy /> Duplicate</DropdownMenuItem> : null}<DropdownMenuItem onClick={() => void setDefault(template.id)} disabled={template.isDefault}><Star /> Set default</DropdownMenuItem><DropdownMenuItem variant="destructive" disabled={template.isDefault} onClick={() => setDeleteTarget(template)}><Trash2 /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></article>)}</div>

    <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl"><DialogHeader><DialogTitle>{items.some((item) => item.id === draft.id) ? "Edit template" : "Add template"}</DialogTitle><DialogDescription>Configure the receipt and preview each change before saving locally.</DialogDescription></DialogHeader><div className="grid gap-7 py-2 md:grid-cols-[1fr_300px]"><div className="space-y-5"><div className="space-y-2"><Label htmlFor="template-name">Template name</Label><Input id="template-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-11" /></div><fieldset><legend className="mb-2 text-sm font-medium">Photo slots</legend><div className="grid grid-cols-2 gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" aria-pressed={draft.layout === option.value} onClick={() => setDraft({ ...draft, layout: option.value, photoSlots: option.slots, size: receiptSizeForSlots(option.slots) })} className={`min-h-11 border px-3 text-sm font-bold ${draft.layout === option.value ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{option.label} / {option.slots}</button>)}</div></fieldset><div className="space-y-2"><Label>Receipt dimensions</Label><div className="flex h-11 items-center border bg-muted/50 px-3 text-sm font-bold">{receiptSizeForSlots(draft.photoSlots)}</div><p className="text-xs text-muted-foreground">Receipt height is assigned automatically from the photo count.</p></div><div className="space-y-2"><Label>Logo placement</Label><div className="grid grid-cols-2 gap-2">{(["top", "bottom"] as const).map((value) => <button key={value} type="button" aria-pressed={draft.logoPlacement === value} onClick={() => setDraft({ ...draft, logoPlacement: value })} className={`min-h-11 border px-3 text-sm font-bold capitalize ${draft.logoPlacement === value ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{value}</button>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><TemplateColorField id="template-primary" label="Template primary" value={draft.palette.primary} onChange={(primary) => setDraft({ ...draft, palette: { ...draft.palette, primary } })} /><TemplateColorField id="template-bg" label="Paper color" value={draft.palette.background} onChange={(background) => setDraft({ ...draft, palette: { ...draft.palette, background } })} /><TemplateColorField id="template-text" label="Receipt text color" value={draft.palette.text} onChange={(text) => setDraft({ ...draft, palette: { ...draft.palette, text } })} /></div></div><div className="flex items-center justify-center bg-muted p-5"><ReceiptPreview template={draft} compact /></div></div><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button onClick={() => void saveDraft()} disabled={!draft.name.trim() || ![draft.palette.primary, draft.palette.background, draft.palette.text].every(isHexColor)}><Save /> Save template</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={imageEditorOpen} onOpenChange={(open) => { if (!savingImage) setImageEditorOpen(open); }}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editingImageTemplate ? "Edit image template" : "Add template using image"}</DialogTitle><DialogDescription>Upload artwork that frames the captured photos. The transparent areas become the photo windows.</DialogDescription></DialogHeader><div className="grid gap-6 py-2 md:grid-cols-[1fr_260px]"><div className="space-y-5"><div className="border border-black/15 bg-muted/40 p-4 text-sm leading-6"><strong>Before uploading</strong><ul className="mt-2 list-disc space-y-1 pl-5"><li>Use a transparent PNG no larger than 8 MB.</li><li>Use the exact pixel dimensions shown for the selected photo count. The minimum format is 800×1000px / 80×100 mm.</li><li>Keep the standardized photo boxes transparent; put artwork around them.</li><li>Do not include private customer information in the design.</li></ul></div><div className="space-y-2"><Label htmlFor="image-template-name">Template name</Label><Input id="image-template-name" value={imageName} maxLength={80} onChange={(event) => setImageName(event.target.value)} /></div><fieldset><legend className="mb-2 text-sm font-medium">Photo slots</legend><div className="grid grid-cols-4 gap-2">{([1, 2, 3, 4] as const).map((slots) => <button key={slots} type="button" aria-pressed={imageSlots === slots} onClick={() => { setImageSlots(slots); setOverlayDataUrl(null); setOverlaySlotRects(null); setOverlayChanged(true); }} className={`min-h-11 border font-bold ${imageSlots === slots ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{slots}</button>)}</div></fieldset><p className="text-sm"><strong>Required:</strong> {overlayPixelsBySlots[imageSlots].width}×{overlayPixelsBySlots[imageSlots].height}px · {receiptSizeForSlots(imageSlots)}</p><input ref={imageInputRef} type="file" accept="image/png" className="sr-only" onChange={(event) => void chooseOverlay(event)} aria-label="Upload transparent template PNG" /><div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()}><Upload /> {overlayDataUrl ? "Replace PNG" : "Choose PNG"}</Button><Button type="button" variant="outline" onClick={() => downloadExample(imageSlots)}><Download /> Download example</Button></div></div><div className="flex min-h-80 items-center justify-center bg-muted p-5">{overlayDataUrl ? <ReceiptPreview template={{ ...freshTemplate(businessPalette), name: imageName, layout: layoutForSlots(imageSlots), photoSlots: imageSlots, size: receiptSizeForSlots(imageSlots), designMode: "image-overlay", overlayImageUrl: overlayDataUrl, overlaySlotRects: overlaySlotRects ?? undefined }} compact /> : <div className="relative w-full overflow-hidden bg-primary p-4 text-white" style={{ aspectRatio: `${overlayPixelsBySlots[imageSlots].width} / ${overlayPixelsBySlots[imageSlots].height}` }}><p className="font-display text-2xl">YOUR LOGO</p><div className="mt-6 grid h-[70%] gap-2" style={{ gridTemplateRows: `repeat(${imageSlots}, minmax(0, 1fr))` }}>{Array.from({ length: imageSlots }, (_, index) => <span key={index} className="bg-white/20" />)}</div><p className="mt-3 text-[10px] font-bold tracking-widest">EXAMPLE OVERLAY</p></div>}</div></div><DialogFooter><DialogClose render={<Button variant="outline" />} disabled={savingImage}>Cancel</DialogClose><Button onClick={() => void saveImageTemplate()} disabled={savingImage || !overlayDataUrl || !overlaySlotRects?.length || !imageName.trim()}>{savingImage ? <LoaderCircle className="animate-spin" /> : <Save />} {savingImage ? "Uploading…" : editingImageTemplate ? "Save changes" : "Save image template"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete {deleteTarget?.name}?</DialogTitle><DialogDescription>This removes the template from this device and the server after synchronization. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={() => void remove()}><Trash2 /> Delete template</Button></DialogFooter></DialogContent></Dialog>
  </>;
}
