"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Business = { _id: string; slug: string; branding: { name: string }; adminCount: number; kioskCount: number };
type Admin = { _id: string; email: string; businessId: string; isEnabled?: boolean; mustChangePassword?: boolean };
type Kiosk = { _id: string; businessId: string; name: string; isEnabled: boolean; lastSeenAt: string | null };

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
  const [email, setEmail] = React.useState("");
  const [businessId, setBusinessId] = React.useState("");
  const [temporaryPassword, setTemporaryPassword] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [nextBusinesses, nextAdmins, nextKiosks] = await Promise.all([
        api<Business[]>("/api/super-admin/businesses"),
        api<Admin[]>("/api/super-admin/admins"),
        api<Kiosk[]>("/api/super-admin/kiosks"),
      ]);
      setBusinesses(nextBusinesses); setAdmins(nextAdmins); setKiosks(nextKiosks); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load accounts."); }
    finally { setLoading(false); }
  }, []);
  React.useEffect(() => { queueMicrotask(() => void refresh()); }, [refresh]);

  async function submit(action: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await action(); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Request failed."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login"); router.refresh();
  }

  return <main className="mx-auto min-h-dvh max-w-6xl space-y-8 bg-background p-5 sm:p-10">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Platform access</p><h1 className="text-4xl font-black">Super admin</h1><p className="text-muted-foreground">Manage businesses, admin access, and paired kiosks. Business photos and settings are not available here.</p></div><button className="min-h-11 rounded-md border px-4" onClick={() => void logout()}>Log out</button></header>
    {error && <p role="alert" className="border border-destructive p-3 text-destructive">{error}</p>}
    {loading && <p role="status" className="border p-4">Loading businesses and access records…</p>}
    {!loading && error && <button className="min-h-11 rounded-md border px-4" onClick={() => void refresh()}>Retry loading</button>}
    {temporaryPassword && <div role="status" className="border-2 border-primary p-4"><strong>Temporary password — shown once:</strong> <code className="select-all break-all">{temporaryPassword}</code><button className="ml-4 underline" onClick={() => setTemporaryPassword(null)}>Dismiss</button><p className="text-sm">Give this directly to the admin through a secure channel. They must change it at first login.</p></div>}
    <section className="grid gap-6 lg:grid-cols-2"><form className="space-y-3 border p-5" onSubmit={(event) => { event.preventDefault(); void submit(async () => { await api("/api/super-admin/businesses", { method: "POST", body: JSON.stringify({ name, slug }) }); setName(""); setSlug(""); toast.success("Business created."); }); }}><h2 className="text-xl font-bold">Create business</h2><label className="block">Business name<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border p-3" /></label><label className="block">URL slug<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} className="mt-1 w-full rounded-md border p-3" /></label><button disabled={busy} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Create business</button></form>
      <form className="space-y-3 border p-5" onSubmit={(event) => { event.preventDefault(); void submit(async () => { const result = await api<{ temporaryPassword: string }>("/api/super-admin/admins", { method: "POST", body: JSON.stringify({ email, businessId }) }); setTemporaryPassword(result.temporaryPassword); setEmail(""); }); }}><h2 className="text-xl font-bold">Create business admin</h2><label className="block">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border p-3" /></label><label className="block">Business<select required value={businessId} onChange={(event) => setBusinessId(event.target.value)} className="mt-1 w-full rounded-md border p-3"><option value="">Select business</option>{businesses.map((item) => <option key={item._id} value={item._id}>{item.branding.name}</option>)}</select></label><button disabled={busy || !businessId} className="min-h-11 rounded-md bg-primary px-5 text-primary-foreground disabled:opacity-50">Create admin</button></form></section>
    <section><h2 className="mb-3 text-2xl font-bold">Businesses</h2>{!loading && businesses.length === 0 && <p className="text-muted-foreground">No businesses yet. Create the first business above.</p>}<div className="grid gap-3 sm:grid-cols-2">{businesses.map((item) => <div key={item._id} className="border p-4"><strong>{item.branding.name}</strong><p className="text-sm text-muted-foreground">/b/{item.slug} · {item.adminCount} enabled admins · {item.kioskCount} paired kiosks</p></div>)}</div></section>
    <section><h2 className="mb-3 text-2xl font-bold">Business admins</h2>{!loading && admins.length === 0 && <p className="text-muted-foreground">No business admins yet.</p>}<div className="space-y-3">{admins.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border p-4"><div><strong>{item.email}</strong><p className="text-sm text-muted-foreground">{businesses.find((business) => business._id === item.businessId)?.branding.name ?? "Unknown business"} · {item.isEnabled === false ? "Disabled" : "Enabled"}{item.mustChangePassword ? " · Password change required" : ""}</p></div><div className="flex flex-wrap gap-2"><button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => void submit(async () => { const result = await api<{ temporaryPassword: string }>(`/api/super-admin/admins/${item._id}`, { method: "PATCH", body: JSON.stringify({ action: "reset-password" }) }); setTemporaryPassword(result.temporaryPassword); })}>Reset password</button><button disabled={busy} className="min-h-11 rounded-md border px-3" onClick={() => { if (confirm(`${item.isEnabled === false ? "Enable" : "Disable"} ${item.email}?`)) void submit(async () => { await api(`/api/super-admin/admins/${item._id}`, { method: "PATCH", body: JSON.stringify({ action: item.isEnabled === false ? "enable" : "disable" }) }); }); }}>{item.isEnabled === false ? "Enable" : "Disable"}</button></div></div>)}</div></section>
    <section><h2 className="mb-3 text-2xl font-bold">Paired kiosks</h2>{!loading && kiosks.length === 0 && <p className="text-muted-foreground">No kiosks paired yet.</p>}<div className="space-y-3">{kiosks.map((item) => <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 border p-4"><div><strong>{item.name}</strong><p className="text-sm text-muted-foreground">{businesses.find((business) => business._id === item.businessId)?.branding.name ?? "Unknown business"} · {item.isEnabled ? "Active" : "Revoked"}</p></div>{item.isEnabled && <button disabled={busy} className="min-h-11 rounded-md border border-destructive px-3 text-destructive" onClick={() => { if (confirm(`Revoke ${item.name}?`)) void submit(async () => { await api(`/api/super-admin/kiosks/${item._id}`, { method: "DELETE" }); }); }}>Revoke</button>}</div>)}</div></section>
  </main>;
}
