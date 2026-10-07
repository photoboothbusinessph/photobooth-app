"use client";

import * as React from "react";
import { RefreshCcw, Wifi } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { photoboothDb } from "@/lib/db/indexed-db";
import { useBusinessStore } from "@/stores/business-store";
import { retryFailedSync } from "@/lib/sync/client-sync";

export function SyncStatusPanel() {
  const businessId = useBusinessStore((state) => state.businessId);
  const pending = useLiveQuery(() => businessId ? photoboothDb.syncQueue.where({ businessId, status: "pending" }).count() : 0, [businessId], 0);
  const failed = useLiveQuery(() => businessId ? photoboothDb.syncQueue.where({ businessId, status: "failed" }).count() : 0, [businessId], 0);
  const [retrying, setRetrying] = React.useState(false);

  async function retry() {
    setRetrying(true);
    await retryFailedSync();
    setRetrying(false);
    toast.success("Sync retry completed");
  }

  return <Card className="rounded-none bg-neutral-950 text-white shadow-none"><CardHeader><CardTitle className="flex items-center gap-2"><Wifi className="size-5 text-emerald-400" /> Sync status</CardTitle></CardHeader><CardContent className="space-y-4 text-sm text-white/65"><div className="flex justify-between"><span>Connection</span><strong className="text-white">{typeof navigator === "undefined" || navigator.onLine ? "Online" : "Offline"}</strong></div><div className="flex justify-between"><span>Pending items</span><strong className="text-white">{pending}</strong></div><div className="flex justify-between"><span>Failed items</span><strong className={failed ? "text-orange-400" : "text-white"}>{failed}</strong></div><Button onClick={() => void retry()} disabled={retrying || (!pending && !failed)} variant="outline" className="h-10 w-full border-white/30 bg-transparent text-white hover:bg-white hover:text-black"><RefreshCcw className={retrying ? "animate-spin" : ""} /> Retry sync</Button></CardContent></Card>;
}
