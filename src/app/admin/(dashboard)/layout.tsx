import { AdminShell } from "@/components/layout/admin-shell";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { TenantViewBoundary } from "@/components/providers/tenant-view-boundary";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (admin.mustChangePassword) redirect("/admin/change-password");
  if (admin.role !== "business_admin") redirect("/super-admin");
  return <TenantViewBoundary businessId={admin.businessId!}><AdminShell>{children}</AdminShell></TenantViewBoundary>;
}
