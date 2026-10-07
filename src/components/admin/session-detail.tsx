"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { SessionActions } from "@/components/admin/session-actions";
import { StatusState } from "@/components/shared/status-state";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { photoboothDb } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import type { SyncStatus } from "@/types";

interface SessionDetailData {
  id: string;
  createdAt: string;
  templateId: string;
  photoCount: number;
  syncStatus: SyncStatus;
  image: string;
  shareToken?: string;
}

export function SessionDetail({ id }: { id: string }) {
  const businessId = useBusinessStore((state) => state.businessId);
  const local = useLiveQuery(async () => { const record = await photoboothDb.sessions.get(id); return record?.businessId === businessId ? record : null; }, [id, businessId]);
  const [remote, setRemote] = React.useState<SessionDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function load() {
      if (!navigator.onLine) { setLoading(false); return; }
      try {
        const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`);
        if (!response.ok) return;
        const { data } = await response.json() as { data: { _id: string; createdAt: string; templateId: string; photoCount: number; syncStatus: "synced"; colorImageUrl: string; shareToken: string } };
        if (active) setRemote({ id: data._id, createdAt: new Date(data.createdAt).toLocaleString(), templateId: data.templateId, photoCount: data.photoCount, syncStatus: data.syncStatus, image: data.colorImageUrl, shareToken: data.shareToken });
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [id]);

  const session = remote ?? (local ? { id: local.id, createdAt: new Date(local.createdAt).toLocaleString(), templateId: local.templateId, photoCount: local.photoCount, syncStatus: local.syncStatus, image: local.colorImage, shareToken: local.shareToken } : null);
  if (loading && !session) return <StatusState type="loading" title="Loading session" description="Checking this device and the cloud archive." />;
  if (!session) return <StatusState type="error" title="Session not found" description="This record may have been deleted or is unavailable on this device." action={<Button nativeButton={false} render={<Link href="/admin/sessions" />}>Back to sessions</Button>} />;

  return <><Button nativeButton={false} render={<Link href="/admin/sessions" />} variant="ghost" className="mb-6"><ArrowLeft /> Back to sessions</Button><div className="grid gap-8 lg:grid-cols-[minmax(300px,0.8fr)_1fr]"><div className="relative min-h-[560px] overflow-hidden bg-neutral-200"><Image src={session.image} alt={`Photo from session ${session.id}`} fill priority unoptimized={session.image.startsWith("data:")} sizes="(max-width: 1024px) 100vw, 45vw" className="object-contain" /></div><section className="flex flex-col"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Session detail</p><h1 className="mt-3 break-all text-4xl font-black tracking-[-0.055em] sm:text-5xl">{session.id}</h1><div className="mt-7 divide-y border-y"><Detail label="Created" value={session.createdAt} /><Detail label="Template" value={session.templateId} /><Detail label="Photo count" value={String(session.photoCount)} /><div className="grid grid-cols-2 items-center py-4 text-sm"><span className="text-muted-foreground">Sync status</span><div><SyncBadge status={session.syncStatus} /></div></div><Detail label="Share token" value={session.shareToken ?? "Available after sync"} /></div><div className="mt-8"><SessionActions sessionId={session.id} image={session.image} /></div><p className="mt-auto pt-10 text-xs leading-5 text-muted-foreground">Reprint uses the browser print dialog. Delete removes the cloud copy when online and queues the action when offline.</p></section></div></>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-2 gap-3 py-4 text-sm"><span className="text-muted-foreground">{label}</span><strong className="break-all">{value}</strong></div>;
}
