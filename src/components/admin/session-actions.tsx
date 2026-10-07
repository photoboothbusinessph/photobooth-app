"use client";

import { useRouter } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { printImageSource } from "@/lib/receipt/render-receipt";
import { activeBusinessId, photoboothDb, queueSync } from "@/lib/db/indexed-db";

export function SessionActions({ sessionId, image }: { sessionId: string; image: string }) {
  const router = useRouter();
  function reprint() {
    if (printImageSource(image, `Receipt ${sessionId}`)) toast.success("Print dialog opened");
    else toast.error("Allow pop-ups to open the print dialog");
  }
  async function remove() {
    try {
      const local = await photoboothDb.sessions.get(sessionId);
      if (local && local.businessId !== activeBusinessId()) throw new Error("Session belongs to another business.");
      if (navigator.onLine) {
        const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
        if (!response.ok && response.status !== 404) throw new Error("Cloud deletion failed.");
      } else await queueSync("session", sessionId, "delete");
      await photoboothDb.transaction("rw", photoboothDb.sessions, photoboothDb.photos, async () => {
        await photoboothDb.sessions.delete(sessionId);
        await photoboothDb.photos.where("sessionId").equals(sessionId).delete();
      });
      toast.success(navigator.onLine ? "Session deleted" : "Session deletion queued");
      router.push("/admin/sessions");
    } catch (error) {
      if (error instanceof Error && error.message === "Session belongs to another business.") { toast.error(error.message); return; }
      await queueSync("session", sessionId, "delete");
      toast.error(error instanceof Error ? `${error.message} It was queued for retry.` : "Deletion queued for retry.");
    }
  }
  return <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={reprint} className="h-11"><Printer /> Reprint</Button><Dialog><DialogTrigger render={<Button variant="destructive" className="h-11" />}><Trash2 /> Delete</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Delete {sessionId}?</DialogTitle><DialogDescription>This removes the local session and its cloud images when online. The action cannot be undone.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={() => void remove()}><Trash2 /> Confirm delete</Button></DialogFooter></DialogContent></Dialog></div>;
}
