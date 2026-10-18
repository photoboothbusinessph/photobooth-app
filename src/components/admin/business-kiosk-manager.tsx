"use client";
import * as React from "react";
import Link from "next/link";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Kiosk = { _id: string; name: string; isEnabled: boolean; pairedAt: string; lastSeenAt: string | null };
type KioskConfirmation = { action: "revoke" | "delete"; kiosk: Kiosk };

export function BusinessKioskManager({ pairHref }: { pairHref: string | null }) {
  const [items, setItems] = React.useState<Kiosk[]>([]);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<KioskConfirmation | null>(null);
  const refresh = React.useCallback(async () => {
    const response = await fetch("/api/admin/kiosks");
    if (!response.ok) throw new Error("Could not load kiosks.");
    const body = await response.json() as { data: Kiosk[] };
    setItems(body.data);
  }, []);
  React.useEffect(() => { queueMicrotask(() => void refresh().catch(() => setError("Could not load kiosks."))); }, [refresh]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/kiosks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const body = await response.json() as { data?: { code: string }; error?: { message: string } };
      if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Could not create pairing code.");
      setCode(body.data.code); setName(""); toast.success("Pairing code ready.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create pairing code."); }
    finally { setBusy(false); }
  }
  async function confirmKioskAction() {
    if (!confirmation) return;
    const { action, kiosk } = confirmation;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/kiosks/${kiosk._id}`, { method: action === "delete" ? "DELETE" : "PATCH" });
      if (!response.ok) throw new Error(action === "delete" ? "Could not delete kiosk." : "Could not revoke kiosk.");
      await refresh();
      toast.success(action === "delete" ? "Kiosk permanently deleted." : "Kiosk revoked.");
      setConfirmation(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update kiosk."); }
    finally { setBusy(false); }
  }
  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Pairing code copied.");
    } catch {
      toast.error("Could not copy the pairing code.");
    }
  }
  return (
    <div className="space-y-6">
      <form onSubmit={(event) => void create(event)} className="max-w-xl space-y-3 border bg-card p-5">
        <h2 className="text-xl font-bold">Pair a new kiosk</h2>
        <label className="block">Device name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border p-3" placeholder="Front desk tablet" /></label>
        <button disabled={busy} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Generate 10-minute code</button>
      </form>
      {code && (
        <div role="status" className="max-w-xl border-2 border-primary p-5">
          <p className="font-bold">Enter this code on the photobooth. It is shown once:</p>
          <p className="mt-2 select-all font-mono text-2xl tracking-widest">{code}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {pairHref && <Button nativeButton={false} render={<Link href={pairHref} />}><ExternalLink /> Open photobooth</Button>}
            <Button variant="outline" onClick={() => void copyCode()}><Copy /> Copy code</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <section>
        <h2 className="mb-3 text-xl font-bold">Paired devices</h2>
        {items.length === 0 ? <p className="text-muted-foreground">No paired kiosks yet.</p> : <div className="space-y-3">{items.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border bg-card p-4"><div><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{item.isEnabled ? "Active" : "Revoked"} · Last seen {item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : "never"}</p></div><div className="flex flex-wrap gap-2">{item.isEnabled && <button disabled={busy} onClick={() => setConfirmation({ action: "revoke", kiosk: item })} className="min-h-11 rounded-md border px-4">Revoke</button>}<button disabled={busy} onClick={() => setConfirmation({ action: "delete", kiosk: item })} className="min-h-11 rounded-md border border-destructive px-4 text-destructive">Delete</button></div></div>)}</div>}
      </section>
      <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open && !busy) setConfirmation(null); }}>
        <DialogContent showCloseButton={!busy}>
          <DialogHeader>
            <DialogTitle>{confirmation?.action === "delete" ? "Permanently delete device?" : "Revoke device access?"}</DialogTitle>
            <DialogDescription>{confirmation?.action === "delete" ? `This permanently deletes ${confirmation.kiosk.name}. The device must be paired again before it can be used.` : `${confirmation?.kiosk.name ?? "This device"} will lose booth access but remain in this list.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={busy}>Cancel</Button>} />
            <Button type="button" variant={confirmation?.action === "delete" ? "destructive" : "default"} disabled={busy} onClick={() => void confirmKioskAction()}>{busy ? "Working…" : confirmation?.action === "delete" ? "Delete permanently" : "Revoke access"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
