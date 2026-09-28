import { PageHeader } from "@/components/admin/page-header";
import { SessionsManager } from "@/components/admin/sessions-manager";

export default function SessionsPage() {
  return <><PageHeader eyebrow="Session archive" title="Sessions" description="Search, inspect, and review sync states across recent booth visits." /><SessionsManager /></>;
}
