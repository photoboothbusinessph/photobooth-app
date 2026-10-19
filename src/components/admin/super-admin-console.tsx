"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Business = { _id: string; slug: string; branding: { name: string }; adminCount: number; kioskCount: number };
type Admin = { _id: string; username: string; businessId: string; isEnabled?: boolean; mustChangePassword?: boolean };
type Kiosk = { _id: string; businessId: string; name: string; isEnabled: boolean; lastSeenAt: string | null };
type AccountConfirmation = { action: "disable" | "delete"; admin: Admin };
type KioskConfirmation = { action: "revoke" | "delete"; kiosk: Kiosk };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  const body = await response.json() as { data?: T; error?: { message: string } };
  if (!response.ok || !body.data) throw new Error(body.error?.message ?? "Request failed.");
  return body.data;
}

export function SuperAdminConsole() {
  const router = useRouter();
  const [businesses, setBusinesses] = React.useState<Business[]>([]);
  const [admins, setAdmins] = React.useState<Admin[]>([]);
  const [kiosks, setKiosks] = React.useState<Kiosk[]>([]);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [businessId, setBusinessId] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState<string | null>(null);
  const [accountConfirmation, setAccountConfirmation] = React.useState<AccountConfirmation | null>(null);
  const [kioskConfirmation, setKioskConfirmation] = React.useState<KioskConfirmation | null>(null);
  const [businessDeleteTarget, setBusinessDeleteTarget] = React.useState<Business | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [nextBusinesses, nextAdmins, nextKiosks] = await Promise.all([
        api<Business[]>("/api/super-admin/businesses"), api<Admin[]>("/api/super-admin/admins"), api<Kiosk[]>("/api/super-admin/kiosks"),
      ]);
      setBusinesses(nextBusinesses); setAdmins(nextAdmins); setKiosks(nextKiosks); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load accounts."); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { queueMicrotask(() => void refresh()); }, [refresh]);

  async function submit(action: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await action(); await refresh(); }
    catch (cause) { const message = cause instanceof Error ? cause.message : "Request failed."; setError(message); toast.error(message); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login"); router.refresh();
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      toast.success("Temporary password copied.");
    } catch {
      toast.error("Could not copy the temporary password.");
    }
  }

  async function confirmAccountAction() {
    if (!accountConfirmation) return;
    const { action, admin } = accountConfirmation;
    await submit(async () => {
      if (action === "delete") {
        await api(`/api/super-admin/admins/${admin._id}`, { method: "DELETE" });
        toast.success(`${admin.username} was permanently deleted.`);
      } else {
        await api(`/api/super-admin/admins/${admin._id}`, { method: "PATCH", body: JSON.stringify({ action: "disable" }) });
        toast.success(`${admin.username} was disabled.`);
      }
      setAccountConfirmation(null);
    });
  }

  async function confirmKioskAction() {
    if (!kioskConfirmation) return;
    const { action, kiosk } = kioskConfirmation;
    await submit(async () => {
      await api(`/api/super-admin/kiosks/${kiosk._id}`, { method: action === "delete" ? "DELETE" : "PATCH" });
      toast.success(action === "delete" ? `${kiosk.name} was permanently deleted.` : `${kiosk.name} was revoked.`);
      setKioskConfirmation(null);
    });
  }

  async function confirmBusinessDeletion() {
    if (!businessDeleteTarget) return;
    const business = businessDeleteTarget;
    await submit(async () => {
      await api(`/api/super-admin/businesses/${business._id}`, { method: "DELETE" });
      if (businessId === business._id) setBusinessId("");
      toast.success(`${business.branding.name} and its related records were permanently deleted.`);
      setBusinessDeleteTarget(null);
    });
  }

  return <main className="mx-auto min-h-dvh max-w-6xl space-y-8 bg-background p-5 sm:p-10">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Platform access</p><h1 className="text-4xl font-black">Super admin</h1><p className="text-muted-foreground">Manage businesses, admin access, and paired kiosks. Business photos and settings are not available here.</p></div><button className="min-h-11 rounded-md border px-4" onClick={() => void logout()}>Log out</button></header>
    {error && <p role="alert" className="border border-destructive p-3 text-destructive">{error}</p>}
    {loading && <p role="status" className="border p-4">Loading businesses and access records…</p>}
    {!loading && error && <button className="min-h-11 rounded-md border px-4" onClick={() => void refresh()}>Retry loading</button>}

    <section className="grid gap-6 lg:grid-cols-2"><form className="space-y-3 border p-5" onSubmit={(event) => { event.preventDefault(); void submit(async () => { await api("/api/super-admin/businesses", { method: "POST", body: JSON.stringify({ name, slug }) }); setName(""); setSlug(""); toast.success("Business created."); }); }}><h2 className="text-xl font-bold">Create business</h2><label className="block">Business name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border p-3" /></label><label className="block">URL slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="mt-1 w-full rounded-md border p-3" /></label><button disabled={busy} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Create business</button></form>
      <form className="space-y-3 border p-5" onSubmit={(event) => { event.preventDefault(); void submit(async () => { const result = await api<{ temporaryPassword: string }>("/api/super-admin/admins", { method: "POST", body: JSON.stringify({ username, businessId }) }); setTemporaryPassword(result.temporaryPassword); setUsername(""); }); }}><h2 className="text-xl font-bold">Create business admin</h2><label className="block">Username<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} className="mt-1 w-full rounded-md border p-3" /></label><label className="block">Business<select required value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="mt-1 w-full rounded-md border p-3"><option value="">Select business</option>{businesses.map((item) => <option key={item._id} value={item._id}>{item.branding.name}</option>)}</select></label><button disabled={busy || !businessId} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Create admin</button></form></section>

    <section><h2 className="mb-3 text-2xl font-bold">Businesses</h2>{!loading && businesses.length === 0 && <p className="text-muted-foreground">No businesses yet. Create the first business above.</p>}<div className="grid gap-3 sm:grid-cols-2">{businesses.map((item) => <div key={item._id} className="flex items-center justify-between gap-3 border p-4"><div className="min-w-0"><strong>{item.branding.name}</strong><p className="text-sm text-muted-foreground">/b/{item.slug} · {item.adminCount} enabled admins · {item.kioskCount} paired kiosks</p></div><button disabled={busy} className="min-h-11 shrink-0 rounded-md border border-destructive px-3 text-destructive" onClick={() => setBusinessDeleteTarget(item)}>Delete</button></div>)}</div></section>

    <section><h2 className="mb-3 text-2xl font-bold">Business admins</h2>{!loading && admins.length === 0 && <p className="text-muted-foreground">No business admins yet.</p>}<div className="space-y-3">{admins.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border p-4"><div><strong>{item.username}</strong><p className="text-sm text-muted-foreground">{businesses.find((business) => business._id === item.businessId)?.branding.name ?? "Unknown business"} · {item.isEnabled === false ? "Disabled" : "Enabled"}{item.mustChangePassword ? " · Password change required" : ""}</p></div><div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => void submit(async () => { const result = await api<{ temporaryPassword: string }>(`/api/super-admin/admins/${item._id}`, { method: "PATCH", body: JSON.stringify({ action: "reset-password" }) }); setTemporaryPassword(result.temporaryPassword); })}>Reset password</button>{item.isEnabled === false ? <button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => void submit(async () => { await api(`/api/super-admin/admins/${item._id}`, { method: "PATCH", body: JSON.stringify({ action: "enable" }) }); toast.success(`${item.username} was enabled.`); })}>Enable</button> : <button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => setAccountConfirmation({ action: "disable", admin: item })}>Disable</button>}<button disabled={busy} className="min-h-11 rounded-md border border-destructive px-3 text-destructive" onClick={() => setAccountConfirmation({ action: "delete", admin: item })}>Delete</button></div></div>)}</div></section>

    <section><h2 className="mb-3 text-2xl font-bold">Paired kiosks</h2>{!loading && kiosks.length === 0 && <p className="text-muted-foreground">No kiosks paired yet.</p>}<div className="space-y-3">{kiosks.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border p-4"><div><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{businesses.find((business) => business._id === item.businessId)?.branding.name ?? "Unknown business"} · {item.isEnabled ? "Active" : "Revoked"}</p></div><div className="flex flex-wrap gap-2">{item.isEnabled && <button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => setKioskConfirmation({ action: "revoke", kiosk: item })}>Revoke</button>}<button disabled={busy} className="min-h-11 rounded-md border border-destructive px-3 text-destructive" onClick={() => setKioskConfirmation({ action: "delete", kiosk: item })}>Delete</button></div></div>)}</div></section>

    <Dialog open={Boolean(temporaryPassword)} onOpenChange={(open) => { if (!open) setTemporaryPassword(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>Temporary password</DialogTitle><DialogDescription>This password is shown only once. Send it directly to the admin through a secure channel.</DialogDescription></DialogHeader><code className="select-all break-all rounded-md border bg-muted p-4 text-center text-base font-bold">{temporaryPassword}</code><p className="text-sm text-muted-foreground">The admin must change it at the next sign in.</p><Button type="button" onClick={() => void copyTemporaryPassword()}><Copy /> Copy password</Button></DialogContent></Dialog>

    <Dialog open={Boolean(accountConfirmation)} onOpenChange={(open) => { if (!open && !busy) setAccountConfirmation(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{accountConfirmation?.action === "delete" ? "Permanently delete account?" : "Disable account?"}</DialogTitle><DialogDescription>{accountConfirmation?.action === "delete" ? `This permanently deletes ${accountConfirmation.admin.username}. This action cannot be undone.` : `${accountConfirmation?.admin.username ?? "This admin"} will immediately lose access until the account is enabled again.`}</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button type="button" variant="outline" disabled={busy}>Cancel</Button>} /><Button type="button" variant="destructive" disabled={busy} onClick={() => void confirmAccountAction()}>{busy ? "Working…" : accountConfirmation?.action === "delete" ? "Delete permanently" : "Disable account"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(kioskConfirmation)} onOpenChange={(open) => { if (!open && !busy) setKioskConfirmation(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>{kioskConfirmation?.action === "delete" ? "Permanently delete kiosk?" : "Revoke kiosk access?"}</DialogTitle><DialogDescription>{kioskConfirmation?.action === "delete" ? `This permanently deletes ${kioskConfirmation.kiosk.name}. The device must be paired again before it can be used.` : `${kioskConfirmation?.kiosk.name ?? "This kiosk"} will lose booth access but will remain in this list.`}</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button type="button" variant="outline" disabled={busy}>Cancel</Button>} /><Button type="button" variant={kioskConfirmation?.action === "delete" ? "destructive" : "default"} disabled={busy} onClick={() => void confirmKioskAction()}>{busy ? "Working…" : kioskConfirmation?.action === "delete" ? "Delete permanently" : "Revoke access"}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(businessDeleteTarget)} onOpenChange={(open) => { if (!open && !busy) setBusinessDeleteTarget(null); }}><DialogContent showCloseButton={!busy}><DialogHeader><DialogTitle>Permanently delete business?</DialogTitle><DialogDescription>This permanently deletes {businessDeleteTarget?.branding.name ?? "this business"}, including its admin accounts, paired kiosks, templates, photo sessions, and pairing codes. This action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button type="button" variant="outline" disabled={busy}>Cancel</Button>} /><Button type="button" variant="destructive" disabled={busy} onClick={() => void confirmBusinessDeletion()}>{busy ? "Deleting…" : "Delete business permanently"}</Button></DialogFooter></DialogContent></Dialog>
  </main>;
}
