import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { SuperAdminConsole } from "@/components/admin/super-admin-console";

export default async function SuperAdminPage() {
  const account = await requireAdmin();
  if (account.mustChangePassword) redirect("/admin/change-password");
  if (account.role !== "super_admin") redirect("/admin");
  return <SuperAdminConsole />;
}
