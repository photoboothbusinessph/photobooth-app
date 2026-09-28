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
import { defaultPalette, templates as initialTemplates } from "@/config/mock-data";
import type { ReceiptTemplate, TemplateLayout } from "@/types";

const layoutOptions: { value: TemplateLayout; label: string; slots: number }[] = [
  { value: "single", label: "Single", slots: 1 }, { value: "double", label: "Double", slots: 2 }, { value: "triple", label: "Triple", slots: 3 }, { value: "quad", label: "Quad", slots: 4 },
];

function freshTemplate(): ReceiptTemplate {
  return { id: `custom-${Date.now()}`, name: "Untitled Template", layout: "double", photoSlots: 2, size: "80 × 180 mm", isDefault: false, logoPlacement: "top", palette: { ...defaultPalette } };
}

export function TemplateManager() {
  const [items, setItems] = React.useState<ReceiptTemplate[]>(initialTemplates);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ReceiptTemplate>(freshTemplate);
  const [deleteTarget, setDeleteTarget] = React.useState<ReceiptTemplate | null>(null);

  function openEditor(template?: ReceiptTemplate) { setDraft(template ? { ...template, palette: { ...template.palette } } : freshTemplate()); setEditorOpen(true); }
  function saveDraft() {
    setItems((current) => current.some((item) => item.id === draft.id) ? current.map((item) => item.id === draft.id ? draft : item) : [...current, draft]);
    setEditorOpen(false); toast.success("Template saved locally");
  }
  function duplicate(template: ReceiptTemplate) {
    setItems((current) => [...current, { ...template, id: `${template.id}-copy-${Date.now()}`, name: `${template.name} Copy`, isDefault: false }]); toast.success("Template duplicated");
  }
  function setDefault(id: string) { setItems((current) => current.map((item) => ({ ...item, isDefault: item.id === id }))); toast.success("Default template updated"); }
  function remove() { if (!deleteTarget) return; setItems((current) => current.filter((item) => item.id !== deleteTarget.id)); setDeleteTarget(null); toast.success("Template removed from this demo"); }

  return (
    <>
      <div className="mb-6 flex justify-end"><Button onClick={() => openEditor()} className="h-11"><Plus /> Add template</Button></div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((template) => <article key={template.id} className="border border-black/15 bg-card p-4">
          <div className="flex min-h-72 items-center justify-center bg-muted p-5"><ReceiptPreview template={template} compact className="shadow-[5px_6px_0_rgb(16_16_16/0.15)]" /></div>
          <div className="mt-4 flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{template.name}</h2>{template.isDefault ? <Badge className="bg-primary text-primary-foreground"><Star className="size-3" /> Default</Badge> : null}</div><p className="mt-1 text-xs text-muted-foreground">{template.photoSlots} slots · {template.size}</p></div><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Actions for ${template.name}`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEditor(template)}><Pencil /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(template)}><Copy /> Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => setDefault(template.id)} disabled={template.isDefault}><Star /> Set default</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(template)}><Trash2 /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
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
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="template-primary">Template primary</Label><div className="flex gap-2"><input id="template-primary" type="color" value={draft.palette.primary} onChange={(event) => setDraft({ ...draft, palette: { ...draft.palette, primary: event.target.value } })} className="h-10 w-12 border p-1" /><Input value={draft.palette.primary} onChange={(event) => setDraft({ ...draft, palette: { ...draft.palette, primary: event.target.value } })} /></div></div><div className="space-y-2"><Label htmlFor="template-bg">Paper color</Label><div className="flex gap-2"><input id="template-bg" type="color" value={draft.palette.background} onChange={(event) => setDraft({ ...draft, palette: { ...draft.palette, background: event.target.value } })} className="h-10 w-12 border p-1" /><Input value={draft.palette.background} onChange={(event) => setDraft({ ...draft, palette: { ...draft.palette, background: event.target.value } })} /></div></div></div>
            </div>
            <div className="flex items-center justify-center bg-muted p-5"><ReceiptPreview template={draft} compact /></div>
          </div>
          <DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button onClick={saveDraft} disabled={!draft.name.trim()}><Save /> Save template</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete {deleteTarget?.name}?</DialogTitle><DialogDescription>This removes the template from the current UI demo. The action cannot be undone during this visit.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={remove}><Trash2 /> Delete template</Button></DialogFooter></DialogContent>
      </Dialog>
    </>
  );
}
