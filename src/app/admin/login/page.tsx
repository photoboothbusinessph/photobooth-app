import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { BrandMark } from "@/components/shared/brand-mark";

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh bg-neutral-950 lg:grid-cols-2">
      <section className="grain relative hidden overflow-hidden bg-[var(--booth-primary)] p-12 text-white lg:flex lg:flex-col lg:justify-between"><BrandMark inverse className="text-5xl" /><p className="max-w-xl text-7xl font-black uppercase leading-[0.82] tracking-[-0.07em]">Control the frame.</p><p className="text-xs font-bold uppercase tracking-[0.2em]">Business branding / Templates / Sessions</p></section>
      <section className="flex items-center justify-center bg-background p-5 sm:p-10"><div className="w-full max-w-md"><Link href="/" className="mb-12 inline-flex min-h-11 items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Back to booth</Link><BrandMark className="lg:hidden" /><p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-primary">Admin access</p><h1 className="mt-2 text-4xl font-black tracking-[-0.055em]">Welcome back.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Manage the booth experience from one place.</p><LoginForm /></div></section>
    </main>
  );
}
