"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FirstPasswordForm({ role }: { role: "super_admin" | "business_admin" }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    if (currentPassword === newPassword) { setError("Choose a different password."); return; }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
      if (!response.ok) { const result = await response.json() as { error?: { message?: string } }; throw new Error(result.error?.message ?? "Password change failed."); }
      router.replace(role === "super_admin" ? "/super-admin" : "/admin");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Password change failed."); setSaving(false); }
  }
  return <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4"><div className="space-y-2"><Label htmlFor="current-password">Temporary password</Label><Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" minLength={8} required /></div><div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={12} required /></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<Button type="submit" disabled={saving} className="h-12 w-full">{saving ? "Saving…" : "Change password"}</Button></form>;
}
