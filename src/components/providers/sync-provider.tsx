"use client";

import * as React from "react";
import { processSyncQueue } from "@/lib/sync/client-sync";

export function SyncProvider() {
  React.useEffect(() => {
    const sync = () => void processSyncQueue();
    window.addEventListener("online", sync);
    window.addEventListener("photobooth-sync-requested", sync);
    queueMicrotask(sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("photobooth-sync-requested", sync);
    };
  }, []);
  return null;
}
