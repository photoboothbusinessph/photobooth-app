import Link from "next/link";
import { StatusState } from "@/components/shared/status-state";
import { Button } from "@/components/ui/button";

export default function SessionNotFound() { return <StatusState type="error" title="Session not found" description="The requested mock session does not exist or has been removed." action={<Button nativeButton={false} render={<Link href="/admin/sessions" />}>Return to sessions</Button>} />; }
