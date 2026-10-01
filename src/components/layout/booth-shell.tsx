import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { SessionCountdown } from "@/components/booth/session-countdown";
import { cn } from "@/lib/utils";

export function BoothShell({ children, title, eyebrow, backHref = "/", step, className, showCountdown = true }: { children: React.ReactNode; title: string; eyebrow?: string; backHref?: string; step?: string; className?: string; showCountdown?: boolean }) {
  return (
    <main className={cn("min-h-dvh bg-[var(--booth-primary)] text-[var(--booth-text)]", className)}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-12">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-white/35 pb-4">
          <Link href={backHref} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="size-5" /> Back
          </Link>
          <BrandMark inverse className="text-2xl sm:text-3xl" />
          <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.14em] text-white/75 sm:gap-4">
            {showCountdown ? <SessionCountdown /> : null}
            <span className="hidden min-w-14 text-right sm:inline">{step}</span>
          </div>
        </header>
        <section className="flex flex-1 flex-col py-8 sm:py-10">
          <div className="mb-7 sm:mb-10">
            {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[var(--booth-accent)]">{eyebrow}</p> : null}
            <h1 className="max-w-4xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl lg:text-7xl">{title}</h1>
          </div>
          {children}
        </section>
        <footer className="hidden items-center justify-between border-t border-white/25 pt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/65 sm:flex">
          <span>Touch-first booth mode</span><span className="inline-flex items-center gap-2"><LockKeyhole className="size-3" /> Session stays on this device</span>
        </footer>
      </div>
    </main>
  );
}
