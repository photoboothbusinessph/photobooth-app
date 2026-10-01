"use client";

import * as React from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const defaults = { countdown: "3", template: "double", size: "80 × 180 mm", fullscreen: true };

export function SettingsForm() {
  const [settings, setSettings] = React.useState(defaults);
  const [saved, setSaved] = React.useState(false);
  function reset() { setSettings(defaults); setSaved(false); toast.success("Settings reset to demo defaults"); }
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="border border-black/15 bg-card p-5 sm:p-7">
        <div className="grid gap-6 sm:grid-cols-2">
          <SettingSelect label="Countdown" value={settings.countdown} onChange={(value) => setSettings({ ...settings, countdown: value })} options={["3", "5", "10"]} suffix=" seconds" />
          <SettingSelect label="Default template" value={settings.template} onChange={(value) => setSettings({ ...settings, template: value })} options={["solo", "double", "triple", "quad"]} labels={["Solo Story", "Double Take", "Three Beats", "Four Frames"]} />
          <SettingSelect label="Receipt size" value={settings.size} onChange={(value) => setSettings({ ...settings, size: value })} options={["80 × 120 mm", "80 × 180 mm", "80 × 220 mm", "80 × 260 mm"]} />
        </div>
        <div className="mt-7 flex min-h-16 items-center justify-between gap-5 border-t pt-6"><div><Label htmlFor="fullscreen">Fullscreen booth mode</Label><p className="mt-1 text-xs text-muted-foreground">Hide browser distractions on supported devices.</p></div><Switch id="fullscreen" checked={settings.fullscreen} onCheckedChange={(value) => setSettings({ ...settings, fullscreen: value })} /></div>
        <Button onClick={() => { setSaved(true); toast.success("Settings saved for this demo session"); }} className="mt-7 h-11"><Save /> {saved ? "Saved locally" : "Save settings"}</Button>
      </section>
      <aside className="space-y-5"><div className="border border-black/15 bg-card p-5"><h2 className="font-bold">Reset settings</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Restore the visible form controls to their UI defaults.</p><Dialog><DialogTrigger render={<Button variant="outline" className="mt-5 h-11 w-full" />}><RotateCcw /> Reset settings</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Reset booth settings?</DialogTitle><DialogDescription>All unsaved changes in this page will return to the demo defaults.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><DialogClose render={<Button onClick={reset} />}>Reset settings</DialogClose></DialogFooter></DialogContent></Dialog></div><div className="border border-destructive/35 bg-destructive/5 p-5"><h2 className="font-bold text-destructive">Danger zone</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Preview the confirmation flow for clearing local booth data.</p><Dialog><DialogTrigger render={<Button variant="destructive" className="mt-5 h-11 w-full" />}><Trash2 /> Reset local data</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Reset all local data?</DialogTitle><DialogDescription>This is a UI-only confirmation. No IndexedDB or browser data exists in this phase, so nothing will actually be removed.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><DialogClose render={<Button variant="destructive" onClick={() => toast.success("Demo confirmation completed — no data removed")} />}><Trash2 /> Confirm reset</DialogClose></DialogFooter></DialogContent></Dialog></div></aside>
    </div>
  );
}

function SettingSelect({ label, value, onChange, options, labels, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: string[]; suffix?: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm">{options.map((option, index) => <option key={option} value={option}>{labels?.[index] ?? `${option}${suffix}`}</option>)}</select></div>;
}
