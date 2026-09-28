"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { business } from "@/config/mock-data";

export function BrandingForm() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [name, setName] = React.useState(business.name);
  const [header, setHeader] = React.useState(business.headerText);
  const [footer, setFooter] = React.useState(business.footerText);
  const [message, setMessage] = React.useState(business.customMessage);
  const [logo, setLogo] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  function chooseLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Choose an image file"); return; }
    setLogo(URL.createObjectURL(file)); setSaved(false); toast.success("Logo preview updated locally");
  }
  function save() { setSaved(true); toast.success("Branding saved for this demo session"); }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_430px]">
      <section className="space-y-8">
        <div className="grid gap-5 border border-black/15 bg-card p-5 sm:p-7">
          <div className="space-y-2"><Label htmlFor="business-name">Business name</Label><Input id="business-name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="header-text">Receipt header</Label><Input id="header-text" value={header} onChange={(event) => { setHeader(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="footer-text">Receipt footer</Label><Input id="footer-text" value={footer} onChange={(event) => { setFooter(event.target.value); setSaved(false); }} className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor="message">Guest message</Label><Textarea id="message" value={message} onChange={(event) => { setMessage(event.target.value); setSaved(false); }} rows={4} /></div>
        </div>
        <div className="border border-black/15 bg-card p-5 sm:p-7">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Business logo</h2><p className="mt-1 text-xs text-muted-foreground">PNG or JPEG preview. Nothing is uploaded.</p></div><ImagePlus className="size-5 text-primary" /></div>
          <div className="mt-5 flex min-h-44 items-center justify-center border border-dashed bg-muted/35 p-6">{logo ? <Image src={logo} alt="Uploaded logo preview" width={240} height={120} unoptimized className="max-h-28 w-auto object-contain" /> : <BrandMark className="text-5xl" />}</div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={chooseLogo} />
          <div className="mt-4 flex flex-wrap gap-3"><Button type="button" variant="outline" className="h-11" onClick={() => inputRef.current?.click()}><Upload /> {logo ? "Replace" : "Choose logo"}</Button><Button type="button" variant="destructive" className="h-11" onClick={() => { setLogo(null); setSaved(false); }} disabled={!logo}><Trash2 /> Remove</Button></div>
        </div>
        <Button onClick={save} className="h-12 w-full sm:w-auto"><Save /> {saved ? "Saved locally" : "Save branding"}</Button>
      </section>
      <aside className="xl:sticky xl:top-24 xl:self-start"><p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Live booth preview</p><div className="grain flex aspect-[4/5] flex-col justify-between overflow-hidden bg-[var(--booth-primary)] p-7 text-white"><div className="flex items-center justify-between">{logo ? <Image src={logo} alt="Live logo preview" width={120} height={60} unoptimized className="max-h-12 w-auto object-contain brightness-0 invert" /> : <BrandMark inverse />}<span className="text-[10px] font-bold uppercase tracking-[0.18em]">Receipt booth</span></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--booth-accent)]">{header || "Your header"}</p><h3 className="mt-4 break-words text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em]">{name || "Your Business"}</h3><p className="mt-5 max-w-xs text-sm text-white/70">{message}</p></div><p className="border-t border-white/30 pt-4 text-xs font-bold uppercase tracking-[0.18em]">{footer}</p></div></aside>
    </div>
  );
}
