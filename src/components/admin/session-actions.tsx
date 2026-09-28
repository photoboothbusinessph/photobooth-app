"use client";

import { useRouter } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SessionActions({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  return <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => toast.success("Reprint preview opened in demo mode")} className="h-11"><Printer /> Reprint</Button><Dialog><DialogTrigger render={<Button variant="destructive" className="h-11" />}><Trash2 /> Delete</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Delete {sessionId}?</DialogTitle><DialogDescription>This only demonstrates the confirmation flow. No stored session data will be deleted.</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={() => { toast.success("Demo session removed"); router.push("/admin/sessions"); }}><Trash2 /> Confirm delete</Button></DialogFooter></DialogContent></Dialog></div>;
}
