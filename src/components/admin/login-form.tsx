"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (!data.get("email") || String(data.get("password")).length < 4) {
      setError("Enter an email and at least four password characters.");
      return;
    }
    setError(""); setLoading(true);
    window.setTimeout(() => { toast.success("Demo admin opened — no authentication performed"); router.push("/admin"); }, 650);
  }
  return (
    <form onSubmit={submit} className="mt-9 space-y-5" noValidate>
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" placeholder="admin@jjnjj.studio" className="h-12 bg-white" aria-invalid={Boolean(error)} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter demo password" className="h-12 bg-white pr-12" aria-invalid={Boolean(error)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-12 place-items-center">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div>
      {error ? <p role="alert" className="flex items-center gap-2 text-sm font-bold text-destructive"><LockKeyhole className="size-4" />{error}</p> : null}
      <Button type="submit" disabled={loading} className="h-12 w-full rounded-none font-black uppercase">{loading ? <><LoaderCircle className="animate-spin" /> Opening demo</> : "Enter admin"}</Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">UI demo only. Credentials are not sent or stored.</p>
    </form>
  );
}
