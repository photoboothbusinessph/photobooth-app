import { SessionDetail } from "@/components/admin/session-detail";

export default async function SessionDetailPage({ params }: PageProps<"/admin/sessions/[id]">) {
  const { id } = await params;
  return <SessionDetail id={id} />;
}
