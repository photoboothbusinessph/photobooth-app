import { BoothLink as Link } from "@/components/booth/booth-link";
import { ArrowLeft } from "lucide-react";
import { BoothPageBackground } from "@/components/booth/booth-page-background";
import { SessionCountdown } from "@/components/booth/session-countdown";
import { cn } from "@/lib/utils";

export function BoothShell({
  children,
  title,
  backHref = "/",
  step,
  className,
  showCountdown = true,
}: {
  children: React.ReactNode;
  title: string;
  backHref?: string;
  step?: string;
  className?: string;
  showCountdown?: boolean;
}) {
  return (
    <main
      className={cn(
        "relative isolate h-dvh min-h-0 overflow-hidden bg-[var(--booth-primary)] text-[var(--booth-text)]",
        className,
      )}
    >
      <BoothPageBackground />
      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col px-[clamp(0.75rem,3vw,3rem)] py-[clamp(0.65rem,1.8dvh,1.5rem)]">
        <header className="grid shrink-0 grid-cols-[1fr_auto] items-center">
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="size-5" /> Back
          </Link>
          <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.14em] text-white/75 sm:gap-4">
            {showCountdown ? <SessionCountdown /> : null}
            <span className="hidden min-w-14 text-right sm:inline">{step}</span>
          </div>
        </header>
        <section className="flex min-h-0 flex-1 flex-col py-[clamp(0.45rem,1.2dvh,0.9rem)]">
          <h1 className="sr-only">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
