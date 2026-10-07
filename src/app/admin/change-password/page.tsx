import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { FirstPasswordForm } from "@/components/admin/first-password-form";

export default async function ChangePasswordPage() {
  const admin = await requireAdmin();
  if (!admin.mustChangePassword) redirect(admin.role === "super_admin" ? "/super-admin" : "/admin");
  return <main className="grid min-h-dvh place-items-center bg-background p-5"><div className="w-full max-w-md border bg-card p-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Account security</p><h1 className="mt-2 text-3xl font-black">Set your password</h1><p className="mt-2 text-sm text-muted-foreground">Replace your temporary password before opening the dashboard.</p><FirstPasswordForm role={admin.role} /></div></main>;
}
