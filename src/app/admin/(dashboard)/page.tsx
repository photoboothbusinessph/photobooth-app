import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SyncStatusPanel } from "@/components/admin/sync-status-panel";
import { StatusState } from "@/components/shared/status-state";
import { SyncBadge } from "@/components/shared/sync-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";
import { getDashboardOverview } from "@/lib/dashboard/overview";

export default async function AdminDashboardPage() {
  await requireAdmin();

  let overview: Awaited<ReturnType<typeof getDashboardOverview>>;
  try {
    overview = await getDashboardOverview();
  } catch {
    return <StatusState type="error" title="Overview unavailable" description="The session archive could not be loaded. Check the database connection and refresh this page." action={<Button nativeButton={false} render={<a href="/admin" />}>Try again</Button>} />;
  }

  const stats = [
    { label: "Sessions in 24 hours", value: String(overview.recentCount), detail: "Confirmed cloud sessions" },
    { label: "Synced sessions", value: String(overview.syncedCount), detail: "Total saved in the cloud" },
    { label: "Active template", value: overview.activeTemplateName ?? "None", detail: `${overview.templateCount} template${overview.templateCount === 1 ? "" : "s"} configured` },
  ];

  return (
    <>
      <PageHeader eyebrow="Live overview" title="Booth activity" description="Confirmed sessions and templates from the business database. Pending items on this device appear in Sync status." action={<Button nativeButton={false} render={<Link href="/" />} className="h-11">Open booth <ArrowUpRight /></Button>} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Dashboard summary">
        {stats.map((stat) => <Card key={stat.label} className="rounded-none border-black/15 shadow-none"><CardHeader><CardTitle className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{stat.label}</CardTitle></CardHeader><CardContent><p className="break-words text-4xl font-black tracking-[-0.06em] sm:text-5xl">{stat.value}</p><p className="mt-3 text-xs text-muted-foreground">{stat.detail}</p></CardContent></Card>)}
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
        <Card className="rounded-none border-black/15 shadow-none">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Recent sessions</CardTitle><Button nativeButton={false} render={<Link href="/admin/sessions" />} variant="ghost" size="sm">View all <ArrowUpRight /></Button></CardHeader>
          <CardContent className="space-y-1">
            {overview.recentSessions.length ? overview.recentSessions.map((session) => <Link key={session.id} href={`/admin/sessions/${session.id}`} className="grid gap-2 border-t py-4 text-sm transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><div className="min-w-0"><p className="truncate font-bold">{session.id}</p><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(session.createdAt)}</p></div><p>{session.templateName}</p><SyncBadge status={session.syncStatus} /></Link>) : <p className="border-t py-8 text-sm text-muted-foreground">No sessions have synced to the cloud yet.</p>}
          </CardContent>
        </Card>
        <SyncStatusPanel />
      </div>
    </>
  );
}
