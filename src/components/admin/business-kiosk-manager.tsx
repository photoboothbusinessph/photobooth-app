"use client";
import * as React from "react";
import { toast } from "sonner";

type Kiosk = { _id: string; name: string; isEnabled: boolean; pairedAt: string; lastSeenAt: string | null };

export function BusinessKioskManager() {
  const [items, setItems] = React.useState<Kiosk[]>([]);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
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
  async function revoke(item: Kiosk) {
    if (!confirm(`Revoke ${item.name}? Unsynced items on this device will be rejected.`)) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/admin/kiosks/${item._id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not revoke kiosk.");
      await refresh(); toast.success("Kiosk revoked.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke kiosk."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6"><form onSubmit={(event) => void create(event)} className="max-w-xl space-y-3 border bg-card p-5"><h2 className="text-xl font-bold">Pair a new kiosk</h2><label className="block">Device name<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border p-3" placeholder="Front desk tablet" /></label><button disabled={busy} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Generate 10-minute code</button></form>{code && <div role="status" className="max-w-xl border-2 border-primary p-5"><p className="font-bold">Enter this code on the kiosk. It is shown once:</p><p className="mt-2 select-all font-mono text-2xl tracking-widest">{code}</p><button className="mt-3 underline" onClick={() => { setCode(null); void refresh(); }}>Done</button></div>}{error && <p role="alert" className="text-destructive">{error}</p>}<section><h2 className="mb-3 text-xl font-bold">Paired devices</h2>{items.length === 0 ? <p className="text-muted-foreground">No paired kiosks yet.</p> : <div className="space-y-3">{items.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border bg-card p-4"><div><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{item.isEnabled ? "Active" : "Revoked"} · Last seen {item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : "never"}</p></div>{item.isEnabled && <button disabled={busy} onClick={() => void revoke(item)} className="min-h-11 rounded-md border border-destructive px-4 text-destructive">Revoke</button>}</div>)}</div>}</section></div>;
}
