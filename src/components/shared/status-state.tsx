import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CameraOff, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = { loading: LoaderCircle, empty: Inbox, error: AlertTriangle, camera: CameraOff };

export function StatusState({ type, title, description, action, className }: { type: keyof typeof icons; title: string; description: string; action?: React.ReactNode; className?: string }) {
  const Icon: LucideIcon = icons[type];
  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center border border-dashed border-border bg-card p-8 text-center", className)}>
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-muted"><Icon className={cn("size-6", type === "loading" && "animate-spin")} /></div>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
