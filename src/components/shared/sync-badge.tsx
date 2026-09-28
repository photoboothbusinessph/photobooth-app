import { AlertCircle, CheckCircle2, Cloud, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/types";

const config = {
  synced: { label: "Synced", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-800" },
  pending: { label: "Pending", icon: Cloud, className: "bg-amber-100 text-amber-800" },
  local: { label: "Local only", icon: HardDrive, className: "bg-blue-100 text-blue-800" },
  failed: { label: "Failed", icon: AlertCircle, className: "bg-red-100 text-red-800" },
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const item = config[status];
  const Icon = item.icon;
  return <Badge className={cn("gap-1.5 border-0", item.className)}><Icon className="size-3" />{item.label}</Badge>;
}
