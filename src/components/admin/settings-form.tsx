"use client";

import * as React from "react";
import { LockKeyhole, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cacheBusinessSettings, queueSync, resetLocalData } from "@/lib/db/indexed-db";
import { receiptSizeBySlots } from "@/lib/receipt/template-rules";
import { MAX_BOOTH_SESSION_DURATION_SECONDS, MIN_BOOTH_SESSION_DURATION_SECONDS } from "@/lib/booth-session";
import { useBusinessStore } from "@/stores/business-store";

const defaults = { countdown: "3", template: "double", fullscreen: true };

export function SettingsForm() {
  const [settings, setSettings] = React.useState(defaults);
  const [saved, setSaved] = React.useState(false);
  const configuredDurationSeconds = useBusinessStore((state) => state.boothSessionDurationSeconds);
  const setBoothSessionDurationSeconds = useBusinessStore((state) => state.setBoothSessionDurationSeconds);
  const [timerMinutes, setTimerMinutes] = React.useState<string | null>(null);
  const [savingTimer, setSavingTimer] = React.useState(false);
  const timerValue = timerMinutes ?? String(configuredDurationSeconds / 60);

  function reset() { setSettings(defaults); setTimerMinutes("2"); setSaved(false); toast.success("Settings reset to defaults"); }
  async function saveSessionTimer() {
    const minutes = Number(timerValue);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) {
      toast.error("Enter a whole number from 1 to 60 minutes.");
      return;
    }
    setSavingTimer(true);
    try {
      const durationSeconds = minutes * 60;
      const state = useBusinessStore.getState();
      await cacheBusinessSettings(state.branding, state.palette, { boothSessionDurationSeconds: durationSeconds }, state.isConfigured);
      await queueSync("business", "default");
      setBoothSessionDurationSeconds(durationSeconds);
      setTimerMinutes(null);
      toast.success(navigator.onLine ? "Session timer saved" : "Session timer saved offline");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The session timer could not be saved.");
    } finally {
      setSavingTimer(false);
    }
  }
  async function clearLocalData() {
    try { await resetLocalData(); toast.success("This business’s local booth data was cleared"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Local data could not be cleared."); }
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="border border-black/15 bg-card p-5 sm:p-7">
        <div className="border-b pb-6">
          <div className="max-w-sm space-y-2">
            <Label htmlFor="booth-session-timer">Booth session timer</Label>
            <div className="flex items-center gap-3">
              <Input id="booth-session-timer" type="number" inputMode="numeric" min={MIN_BOOTH_SESSION_DURATION_SECONDS / 60} max={MAX_BOOTH_SESSION_DURATION_SECONDS / 60} step={1} value={timerValue} onChange={(event) => setTimerMinutes(event.target.value)} aria-describedby="booth-session-timer-help" className="h-11" />
              <span className="shrink-0 text-sm text-muted-foreground">minutes</span>
            </div>
            <p id="booth-session-timer-help" className="text-xs leading-5 text-muted-foreground">Sets the countdown shown during each guest session. Changes apply to the next session.</p>
            <Button type="button" onClick={() => void saveSessionTimer()} disabled={savingTimer || !timerValue} className="mt-2 h-11"><Save /> {savingTimer ? "Savingâ€¦" : "Save timer"}</Button>
          </div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <SettingSelect label="Countdown" value={settings.countdown} onChange={(value) => setSettings({ ...settings, countdown: value })} options={["3", "5", "10"]} suffix=" seconds" />
          <SettingSelect label="Default template" value={settings.template} onChange={(value) => setSettings({ ...settings, template: value })} options={["solo", "double", "triple", "quad"]} labels={["Solo Story", "Double Take", "Three Beats", "Four Frames"]} />
        </div>
        <div className="mt-7 border-t pt-6"><h2 className="font-bold">Automatic receipt sizes</h2><p className="mt-1 text-sm text-muted-foreground">Paper height follows the selected photo layout so previews, downloads, and printing stay consistent.</p><dl className="mt-4 grid gap-3 sm:grid-cols-3"><div className="border p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1 photo</dt><dd className="mt-1 font-bold">{receiptSizeBySlots[1]}</dd></div><div className="border p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2–3 photos</dt><dd className="mt-1 font-bold">{receiptSizeBySlots[2]}</dd></div><div className="border p-4"><dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">4 photos</dt><dd className="mt-1 font-bold">{receiptSizeBySlots[4]}</dd></div></dl></div>
        <div className="mt-7 flex min-h-16 items-center justify-between gap-5 border-t pt-6"><div><Label htmlFor="fullscreen">Fullscreen booth mode</Label><p className="mt-1 text-xs text-muted-foreground">Hide browser distractions on supported devices.</p></div><Switch id="fullscreen" checked={settings.fullscreen} onCheckedChange={(value) => setSettings({ ...settings, fullscreen: value })} /></div>
        <Button onClick={() => { setSaved(true); toast.info("Settings are only kept on this page for now."); }} className="mt-7 h-11"><Save /> {saved ? "Set for this visit" : "Apply settings preview"}</Button>
      </section>
      <aside className="space-y-5"><ChangePasswordCard /><div className="border border-black/15 bg-card p-5"><h2 className="font-bold">Reset settings</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Restore the visible form controls to their UI defaults.</p><Dialog><DialogTrigger render={<Button variant="outline" className="mt-5 h-11 w-full" />}><RotateCcw /> Reset settings</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Reset booth settings?</DialogTitle><DialogDescription>All unsaved changes in this page will return to the defaults.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><DialogClose render={<Button onClick={reset} />}>Reset settings</DialogClose></DialogFooter></DialogContent></Dialog></div><div className="border border-destructive/35 bg-destructive/5 p-5"><h2 className="font-bold text-destructive">Danger zone</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Clear this business’s cached branding, templates, sessions, photos, and pending sync work from this device.</p><Dialog><DialogTrigger render={<Button variant="destructive" className="mt-5 h-11 w-full" />}><Trash2 /> Reset local data</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Reset this business’s local data?</DialogTitle><DialogDescription>This permanently removes this business’s photobooth data saved in this browser. Other businesses’ local data is not affected.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><DialogClose render={<Button variant="destructive" onClick={() => void clearLocalData()} />}><Trash2 /> Confirm reset</DialogClose></DialogFooter></DialogContent></Dialog></div></aside>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      const result = await response.json() as { error?: { message?: string } };
      if (!response.ok) throw new Error(result.error?.message ?? "Password change failed.");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Admin password changed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={(event) => void changePassword(event)} className="border border-black/15 bg-card p-5"><div className="flex items-center gap-2"><LockKeyhole className="size-4 text-primary" /><h2 className="font-bold">Change password</h2></div><div className="mt-4 space-y-3"><div className="space-y-1.5"><Label htmlFor="current-password">Current password</Label><Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required minLength={8} /></div><div className="space-y-1.5"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={12} /></div></div><Button type="submit" variant="outline" disabled={saving || newPassword.length < 12} className="mt-5 h-11 w-full"><LockKeyhole /> {saving ? "Updating…" : "Update password"}</Button></form>;
}

function SettingSelect({ label, value, onChange, options, labels, suffix = "" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: string[]; suffix?: string }) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm">{options.map((option, index) => <option key={option} value={option}>{labels?.[index] ?? `${option}${suffix}`}</option>)}</select></div>;
}
