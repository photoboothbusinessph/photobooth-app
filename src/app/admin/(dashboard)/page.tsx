import Link from "next/link";
import { ArrowUpRight, Cloud, HardDrive, Wifi } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardStats, sessions } from "@/config/mock-data";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader eyebrow="Live overview" title="Good evening." description="A quick view of tonight’s booth activity. Dashboard values are realistic mock data for this UI phase." action={<Button nativeButton={false} render={<Link href="/" />} className="h-11">Open booth <ArrowUpRight /></Button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard summary">
        {dashboardStats.map((stat, index) => <Card key={stat.label} className="rounded-none border-black/15 shadow-none"><CardHeader><CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</CardTitle></CardHeader><CardContent><p className="text-5xl font-black tracking-[-0.07em]">{stat.value}</p><p className="mt-3 text-xs text-muted-foreground">{stat.detail}</p>{index === 0 ? <div className="mt-5 h-1 bg-muted"><div className="h-full w-3/4 bg-primary" /></div> : null}</CardContent></Card>)}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
        <Card className="rounded-none border-black/15 shadow-none"><CardHeader className="flex-row items-center justify-between"><CardTitle>Recent sessions</CardTitle><Button nativeButton={false} render={<Link href="/admin/sessions" />} variant="ghost" size="sm">View all <ArrowUpRight /></Button></CardHeader><CardContent className="space-y-1">{sessions.slice(0, 4).map((session) => <Link key={session.id} href={`/admin/sessions/${session.id}`} className="grid gap-2 border-t py-4 text-sm transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div><p className="font-bold">{session.id}</p><p className="text-xs text-muted-foreground">{session.createdAt}</p></div><p>{session.template}</p><SyncBadge status={session.syncStatus} /></Link>)}</CardContent></Card>
        <div className="space-y-6"><Card className="rounded-none bg-neutral-950 text-white shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><Wifi className="size-5 text-emerald-400" /> Booth online</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-white/65"><div className="flex justify-between"><span>Last check</span><strong className="text-white">Just now</strong></div><div className="flex justify-between"><span>Pending items</span><strong className="text-white">3</strong></div></CardContent></Card><Card className="rounded-none border-black/15 shadow-none"><CardHeader><CardTitle>Storage</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3 text-sm"><HardDrive className="size-5" /><span>1.8 GB of 5 GB</span></div><div className="mt-4 h-2 bg-muted"><div className="h-full w-[36%] bg-primary" /></div><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="size-3" /> Mock storage indicator</p></CardContent></Card></div>
      </div>
    </>
  );
}
