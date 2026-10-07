"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Search, Trash2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { StatusState } from "@/components/shared/status-state";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { photoboothDb, queueSync } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import type { BoothSession, SyncStatus } from "@/types";

interface RemoteSession {
  _id: string;
  templateId: string;
  photoCount: number;
  colorImageUrl: string;
  syncStatus: "synced";
  createdAt: string;
}

export function SessionsManager() {
  const businessId = useBusinessStore((state) => state.businessId);
  const localSessions = useLiveQuery(() => businessId ? photoboothDb.sessions.where("businessId").equals(businessId).reverse().sortBy("createdAt") : [], [businessId]);
  const [remoteSessions, setRemoteSessions] = React.useState<RemoteSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | SyncStatus>("all");
  const [deleteTarget, setDeleteTarget] = React.useState<BoothSession | null>(null);

  React.useEffect(() => {
    let active = true;
    async function loadRemoteSessions() {
      if (!navigator.onLine) { setLoading(false); return; }
      try {
        const response = await fetch("/api/sessions");
        const result = await response.json() as { data?: RemoteSession[] };
        if (!response.ok || !result.data) throw new Error("Unable to load cloud sessions.");
        if (active) setRemoteSessions(result.data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRemoteSessions();
    return () => { active = false; };
  }, []);

  const items = React.useMemo(() => {
    const merged = new Map<string, BoothSession>();
    for (const session of localSessions ?? []) merged.set(session.id, { id: session.id, createdAt: new Date(session.createdAt).toLocaleString(), template: session.templateId, photoCount: session.photoCount, syncStatus: session.syncStatus, image: session.colorImage });
    for (const session of remoteSessions) merged.set(session._id, { id: session._id, createdAt: new Date(session.createdAt).toLocaleString(), template: session.templateId, photoCount: session.photoCount, syncStatus: session.syncStatus, image: session.colorImageUrl });
    return [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [localSessions, remoteSessions]);
  const filtered = items.filter((item) => (status === "all" || item.syncStatus === status) && `${item.id} ${item.template}`.toLowerCase().includes(query.toLowerCase()));

  async function remove() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      const localRecord = await photoboothDb.sessions.get(target.id);
      if (localRecord && localRecord.businessId !== useBusinessStore.getState().businessId) throw new Error("Session belongs to another business.");
      if (navigator.onLine) {
        const response = await fetch(`/api/sessions/${encodeURIComponent(target.id)}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) throw new Error("Cloud deletion failed.");
      } else {
        await queueSync("session", target.id, "delete");
      }
      await photoboothDb.transaction("rw", photoboothDb.sessions, photoboothDb.photos, async () => {
        await photoboothDb.sessions.delete(target.id);
        await photoboothDb.photos.where("sessionId").equals(target.id).delete();
      });
      setRemoteSessions((current) => current.filter((item) => item._id !== target.id));
      setDeleteTarget(null);
      toast.success(navigator.onLine ? "Session deleted" : "Session deletion queued");
    } catch (error) {
      if (error instanceof Error && error.message === "Session belongs to another business.") { toast.error(error.message); return; }
      await queueSync("session", target.id, "delete");
      toast.error(error instanceof Error ? `${error.message} It was queued for retry.` : "Deletion queued for retry.");
    }
  }

  if (loading && !items.length) return <StatusState type="loading" title="Loading sessions" description="Checking local and cloud session records." />;
  if (loadError && !items.length) return <StatusState type="error" title="Sessions are unavailable" description="The cloud archive could not be loaded. Check the connection and try again." action={<Button onClick={() => location.reload()}>Try again</Button>} />;

  return (
    <>
      {loadError && items.length ? <p className="mb-4 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">Showing sessions saved on this device because the cloud archive is unavailable.</p> : null}
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_190px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search session or template" aria-label="Search sessions" className="h-11 pl-10" /></div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Filter by sync status"><option value="all">All sync states</option><option value="synced">Synced</option><option value="pending">Pending</option><option value="local">Local only</option><option value="failed">Failed</option></select></div>
      {filtered.length ? <>
        <div className="hidden border border-black/15 bg-card md:block"><Table><TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Session</TableHead><TableHead>Date / time</TableHead><TableHead>Template</TableHead><TableHead>Photos</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((session) => <TableRow key={session.id}><TableCell><div className="relative size-12 overflow-hidden"><Image src={session.image} alt="Session preview" fill unoptimized={session.image.startsWith("data:")} sizes="48px" className="object-cover" /></div></TableCell><TableCell className="font-bold">{session.id}</TableCell><TableCell className="text-muted-foreground">{session.createdAt}</TableCell><TableCell>{session.template}</TableCell><TableCell>{session.photoCount}</TableCell><TableCell><SyncBadge status={session.syncStatus} /></TableCell><TableCell><div className="flex justify-end gap-1"><Button nativeButton={false} render={<Link href={`/admin/sessions/${session.id}`} />} variant="ghost" size="icon" aria-label={`View ${session.id}`}><Eye /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(session)} aria-label={`Delete ${session.id}`}><Trash2 className="text-destructive" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{filtered.map((session) => <article key={session.id} className="grid grid-cols-[72px_1fr] gap-4 border bg-card p-4"><div className="relative aspect-square overflow-hidden"><Image src={session.image} alt="Session preview" fill unoptimized={session.image.startsWith("data:")} sizes="72px" className="object-cover" /></div><div className="min-w-0"><p className="truncate font-bold">{session.id}</p><p className="mt-1 text-xs text-muted-foreground">{session.createdAt}</p><div className="mt-3 flex items-center justify-between gap-2"><SyncBadge status={session.syncStatus} /><div className="flex"><Button nativeButton={false} render={<Link href={`/admin/sessions/${session.id}`} />} variant="ghost" size="icon" aria-label={`View ${session.id}`}><Eye /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(session)} aria-label={`Delete ${session.id}`}><Trash2 className="text-destructive" /></Button></div></div></div></article>)}</div>
      </> : <StatusState type="empty" title="No sessions found" description="Try another search term or sync-status filter." action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button>} />}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete session {deleteTarget?.id}?</DialogTitle><DialogDescription>This removes the local copy and its cloud images when online. The action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={() => void remove()}><Trash2 /> Delete session</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}
