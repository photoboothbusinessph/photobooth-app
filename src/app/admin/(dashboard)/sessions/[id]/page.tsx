import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { SessionActions } from "@/components/admin/session-actions";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { sessions } from "@/config/mock-data";

export default async function SessionDetailPage({ params }: PageProps<"/admin/sessions/[id]">) {
  const { id } = await params;
  const session = sessions.find((item) => item.id === id);
  if (!session) notFound();
  return <><Button nativeButton={false} render={<Link href="/admin/sessions" />} variant="ghost" className="mb-6"><ArrowLeft /> Back to sessions</Button><div className="grid gap-8 lg:grid-cols-[minmax(300px,0.8fr)_1fr]"><div className="relative min-h-[560px] overflow-hidden bg-neutral-200"><Image src={session.image} alt={`Photo from session ${session.id}`} fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover" /></div><section className="flex flex-col"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Session detail</p><h1 className="mt-3 break-all text-4xl font-black tracking-[-0.055em] sm:text-5xl">{session.id}</h1><div className="mt-7 divide-y border-y"><Detail label="Created" value={session.createdAt} /><Detail label="Template" value={session.template} /><Detail label="Photo count" value={String(session.photoCount)} /><div className="grid grid-cols-2 items-center py-4 text-sm"><span className="text-muted-foreground">Sync status</span><div><SyncBadge status={session.syncStatus} /></div></div><Detail label="Share token" value="demo-token-0928" /></div><div className="mt-8"><SessionActions sessionId={session.id} /></div><p className="mt-auto pt-10 text-xs leading-5 text-muted-foreground">Reprint and delete are local UI demonstrations. No storage or server operation is performed.</p></section></div></>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-2 py-4 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>; }
