"use client";

import * as React from "react";
import { processSyncQueue } from "@/lib/sync/client-sync";

export function SyncProvider() {
  React.useEffect(() => {
    const sync = () => void processSyncQueue();
    const syncWhenVisible = () => { if (!document.hidden) sync(); };
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("photobooth-sync-requested", sync);
    document.addEventListener("visibilitychange", syncWhenVisible);
    const retryTimer = window.setInterval(syncWhenVisible, 15_000);
    queueMicrotask(sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("photobooth-sync-requested", sync);
      document.removeEventListener("visibilitychange", syncWhenVisible);
      window.clearInterval(retryTimer);
    };
  }, []);
  return null;
}
