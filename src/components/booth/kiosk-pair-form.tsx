"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { photoboothDb } from "@/lib/db/indexed-db";

export function KioskPairForm({ slug, businessName }: { slug: string; businessName: string }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const unsynced = useLiveQuery(async () => {
    const items = await photoboothDb.syncQueue.where("tenantKey").equals(slug).toArray();
    return items.filter((item) => item.entityType === "session" && ["pending", "failed"].includes(item.status));
  }, [slug], []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/kiosks/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, code: code.trim().toUpperCase() }) });
      if (!response.ok) { const body = await response.json() as { error?: { message: string } }; throw new Error(body.error?.message ?? "Pairing failed."); }
      router.replace(`/b/${slug}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Pairing failed."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-dvh place-items-center bg-[var(--booth-primary)] p-5 text-white"><div className="w-full max-w-md space-y-5"><form onSubmit={(event) => void submit(event)} className="space-y-5 border-2 border-white p-7"><p className="text-sm font-bold uppercase tracking-widest">{businessName}</p><h1 className="text-4xl font-black uppercase">Pair this kiosk</h1><p>Ask your business admin for a one-time pairing code. It expires after 10 minutes.</p><label className="block font-bold">Pairing code<input autoComplete="off" required minLength={16} maxLength={16} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="mt-2 w-full rounded-md border p-4 font-mono text-xl text-black" /></label>{error && <p role="alert" className="text-yellow-300">{error}</p>}<button disabled={busy} className="min-h-14 w-full bg-[var(--booth-accent)] px-5 font-black uppercase text-black disabled:opacity-50">{busy ? "Pairing…" : "Pair kiosk"}</button></form>{unsynced.length > 0 && <aside role="status" className="border-2 border-[var(--booth-accent)] p-5"><strong>{unsynced.length} photo session{unsynced.length === 1 ? "" : "s"} still on this device</strong><p className="mt-2 text-sm">These have not reached the server. Do not clear browser data. Ask an operator to restore kiosk access, then reconnect and retry sync.</p><ul className="mt-3 max-h-32 overflow-y-auto font-mono text-xs">{unsynced.map((item) => <li key={item.id}>{item.entityId} · {item.status}{item.lastError ? ` · ${item.lastError}` : ""}</li>)}</ul></aside>}</div></main>;
}
