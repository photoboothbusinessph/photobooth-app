"use client";

import * as React from "react";
import { CloudOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function NetworkStatus() {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    queueMicrotask(update);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div role="status" className={cn("fixed bottom-4 right-4 z-50 flex min-h-10 items-center gap-2 border-2 border-black px-3 text-xs font-black uppercase shadow-[4px_4px_0_#101010]", online ? "bg-[var(--booth-accent)] text-black" : "bg-orange-500 text-black")}>
      {online ? <Wifi className="size-4" /> : <CloudOff className="size-4" />}
      {online ? "Online" : "Offline · saved locally"}
    </div>
  );
}
