"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusState } from "@/components/shared/status-state";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sessions as initialSessions } from "@/config/mock-data";
import type { BoothSession, SyncStatus } from "@/types";

export function SessionsManager() {
  const [items, setItems] = React.useState(initialSessions);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | SyncStatus>("all");
  const [deleteTarget, setDeleteTarget] = React.useState<BoothSession | null>(null);
  const filtered = items.filter((item) => (status === "all" || item.syncStatus === status) && `${item.id} ${item.template}`.toLowerCase().includes(query.toLowerCase()));
  function remove() { if (!deleteTarget) return; setItems((current) => current.filter((item) => item.id !== deleteTarget.id)); setDeleteTarget(null); toast.success("Session removed from this demo"); }
  return (
    <>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_190px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search session or template" aria-label="Search sessions" className="h-11 pl-10" /></div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Filter by sync status"><option value="all">All sync states</option><option value="synced">Synced</option><option value="pending">Pending</option><option value="local">Local only</option><option value="failed">Failed</option></select></div>
      {filtered.length ? <>
        <div className="hidden border border-black/15 bg-card md:block"><Table><TableHeader><TableRow><TableHead>Preview</TableHead><TableHead>Session</TableHead><TableHead>Date / time</TableHead><TableHead>Template</TableHead><TableHead>Photos</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((session) => <TableRow key={session.id}><TableCell><div className="relative size-12 overflow-hidden"><Image src={session.image} alt="Session preview" fill sizes="48px" className="object-cover" /></div></TableCell><TableCell className="font-bold">{session.id}</TableCell><TableCell className="text-muted-foreground">{session.createdAt}</TableCell><TableCell>{session.template}</TableCell><TableCell>{session.photoCount}</TableCell><TableCell><SyncBadge status={session.syncStatus} /></TableCell><TableCell><div className="flex justify-end gap-1"><Button nativeButton={false} render={<Link href={`/admin/sessions/${session.id}`} />} variant="ghost" size="icon" aria-label={`View ${session.id}`}><Eye /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(session)} aria-label={`Delete ${session.id}`}><Trash2 className="text-destructive" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{filtered.map((session) => <article key={session.id} className="grid grid-cols-[72px_1fr] gap-4 border bg-card p-4"><div className="relative aspect-square overflow-hidden"><Image src={session.image} alt="Session preview" fill sizes="72px" className="object-cover" /></div><div className="min-w-0"><p className="truncate font-bold">{session.id}</p><p className="mt-1 text-xs text-muted-foreground">{session.createdAt}</p><div className="mt-3 flex items-center justify-between gap-2"><SyncBadge status={session.syncStatus} /><div className="flex"><Button nativeButton={false} render={<Link href={`/admin/sessions/${session.id}`} />} variant="ghost" size="icon" aria-label={`View ${session.id}`}><Eye /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(session)} aria-label={`Delete ${session.id}`}><Trash2 className="text-destructive" /></Button></div></div></div></article>)}</div>
      </> : <StatusState type="empty" title="No sessions found" description="Try another search term or sync-status filter." action={<Button variant="outline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Button>} />}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete session {deleteTarget?.id}?</DialogTitle><DialogDescription>This UI-only action removes it from the current list. Cloud and local records are not touched.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={remove}><Trash2 /> Delete session</Button></DialogFooter></DialogContent></Dialog>
    </>
  );
}
