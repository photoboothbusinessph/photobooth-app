"use client";

import * as React from "react";
import { Copy, MoreHorizontal, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ReceiptPreview } from "@/components/receipt/receipt-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activeTenantKey, cacheTemplates, photoboothDb, queueSync } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import type { ReceiptTemplate, TemplateLayout } from "@/types";

const layoutOptions: { value: TemplateLayout; label: string; slots: number }[] = [
  { value: "single", label: "Single", slots: 1 }, { value: "double", label: "Double", slots: 2 }, { value: "triple", label: "Triple", slots: 3 }, { value: "quad", label: "Quad", slots: 4 },
];

const isHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

function TemplateColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><div className="flex gap-2"><input id={id} type="color" value={isHexColor(value) ? value : "#101010"} onChange={(event) => onChange(event.target.value)} className="h-11 w-12 shrink-0 border p-1" /><Input aria-label={`${label} hex color`} value={value} maxLength={7} aria-invalid={!isHexColor(value)} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0" /></div>{!isHexColor(value) ? <p className="text-xs text-destructive">Use a six-digit hex color, such as #101010.</p> : null}</div>;
}

function freshTemplate(palette: ReceiptTemplate["palette"]): ReceiptTemplate {
  return { id: `custom-${Date.now()}`, name: "Untitled Template", layout: "double", photoSlots: 2, size: "80 × 180 mm", isDefault: false, logoPlacement: "top", palette: { ...palette } };
}

export function TemplateManager() {
  const storedTemplates = useBusinessStore((state) => state.templates);
  const setStoredTemplates = useBusinessStore((state) => state.setTemplates);
  const businessPalette = useBusinessStore((state) => state.palette);
  const items = storedTemplates;
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ReceiptTemplate>(() => freshTemplate(useBusinessStore.getState().palette));
  const [deleteTarget, setDeleteTarget] = React.useState<ReceiptTemplate | null>(null);

  async function persist(next: ReceiptTemplate[], templateId: string, operation: "upsert" | "delete" = "upsert") {
    setStoredTemplates(next);
    await cacheTemplates(next);
    await queueSync("template", templateId, operation);
  }

  function openEditor(template?: ReceiptTemplate) { setDraft(template ? { ...template, palette: { ...template.palette } } : freshTemplate(businessPalette)); setEditorOpen(true); }
  async function saveDraft() {
    const next = items.some((item) => item.id === draft.id) ? items.map((item) => item.id === draft.id ? draft : item) : [...items, draft];
    await persist(next, draft.id);
    setEditorOpen(false);
    toast.success(navigator.onLine ? "Template saved and queued for sync" : "Template saved offline");
  }
  async function duplicate(template: ReceiptTemplate) {
    const copy = { ...template, id: `${template.id}-copy-${Date.now()}`, name: `${template.name} Copy`, isDefault: false };
    await persist([...items, copy], copy.id);
    toast.success("Template duplicated");
  }
  async function setDefault(id: string) {
    const next = items.map((item) => ({ ...item, isDefault: item.id === id }));
    await persist(next, id);
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

  return (
    <>
      <div className="mb-6 flex justify-end"><Button onClick={() => openEditor()} className="h-11"><Plus /> Add template</Button></div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((template) => <article key={template.id} className="border border-black/15 bg-card p-4">
          <div className="flex min-h-72 items-center justify-center bg-muted p-5"><ReceiptPreview template={template} compact className="shadow-[5px_6px_0_rgb(16_16_16/0.15)]" /></div>
          <div className="mt-4 flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{template.name}</h2>{template.isDefault ? <Badge className="bg-primary text-primary-foreground"><Star className="size-3" /> Default</Badge> : null}</div><p className="mt-1 text-xs text-muted-foreground">{template.photoSlots} slots · {template.size}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${template.name}`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEditor(template)}><Pencil /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => void duplicate(template)}><Copy /> Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => void setDefault(template.id)} disabled={template.isDefault}><Star /> Set default</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(template)}><Trash2 /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        </article>)}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle>{items.some((item) => item.id === draft.id) ? "Edit template" : "Add template"}</DialogTitle><DialogDescription>Configure the receipt and preview each change before saving locally.</DialogDescription></DialogHeader>
          <div className="grid gap-7 py-2 md:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <div className="space-y-2"><Label htmlFor="template-name">Template name</Label><Input id="template-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-11" /></div>
              <fieldset><legend className="mb-2 text-sm font-medium">Photo slots</legend><div className="grid grid-cols-2 gap-2">{layoutOptions.map((option) => <button key={option.value} type="button" aria-pressed={draft.layout === option.value} onClick={() => setDraft({ ...draft, layout: option.value, photoSlots: option.slots })} className={`min-h-11 border px-3 text-sm font-bold ${draft.layout === option.value ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{option.label} / {option.slots}</button>)}</div></fieldset>
              <div className="space-y-2"><Label htmlFor="receipt-size">Receipt dimensions</Label><select id="receipt-size" value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option>80 × 120 mm</option><option>80 × 180 mm</option><option>80 × 220 mm</option><option>80 × 260 mm</option></select></div>
              <div className="space-y-2"><Label>Logo placement</Label><div className="grid grid-cols-2 gap-2">{(["top", "bottom"] as const).map((value) => <button key={value} type="button" aria-pressed={draft.logoPlacement === value} onClick={() => setDraft({ ...draft, logoPlacement: value })} className={`min-h-11 border px-3 text-sm font-bold capitalize ${draft.logoPlacement === value ? "border-primary bg-primary text-white" : "hover:bg-muted"}`}>{value}</button>)}</div></div>
              <div className="grid gap-4 sm:grid-cols-2"><TemplateColorField id="template-primary" label="Template primary" value={draft.palette.primary} onChange={(primary) => setDraft({ ...draft, palette: { ...draft.palette, primary } })} /><TemplateColorField id="template-bg" label="Paper color" value={draft.palette.background} onChange={(background) => setDraft({ ...draft, palette: { ...draft.palette, background } })} /><TemplateColorField id="template-text" label="Receipt text color" value={draft.palette.text} onChange={(text) => setDraft({ ...draft, palette: { ...draft.palette, text } })} /></div>
            </div>
            <div className="flex items-center justify-center bg-muted p-5"><ReceiptPreview template={draft} compact /></div>
          </div>
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button onClick={() => void saveDraft()} disabled={!draft.name.trim() || ![draft.palette.primary, draft.palette.background, draft.palette.text].every(isHexColor)}><Save /> Save template</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete {deleteTarget?.name}?</DialogTitle><DialogDescription>This removes the template from this device and the server after synchronization. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={() => void remove()}><Trash2 /> Delete template</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}
