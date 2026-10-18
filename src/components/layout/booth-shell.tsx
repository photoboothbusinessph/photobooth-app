import { BoothLink as Link } from "@/components/booth/booth-link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { SessionCountdown } from "@/components/booth/session-countdown";
import { cn } from "@/lib/utils";

export function BoothShell({
  children,
  title,
  eyebrow,
  backHref = "/",
  step,
  className,
  showCountdown = true,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow?: string;
  backHref?: string;
  step?: string;
  className?: string;
  showCountdown?: boolean;
}) {
  return (
    <main
      className={cn(
        "h-dvh min-h-0 overflow-hidden bg-[var(--booth-primary)] text-[var(--booth-text)]",
        className,
      )}
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col px-[clamp(0.75rem,3vw,3rem)] py-[clamp(0.65rem,1.8dvh,1.5rem)]">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/35 pb-[clamp(0.5rem,1.3dvh,1rem)]">
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="size-5" /> Back
          </Link>
          <BrandMark inverse className="text-2xl sm:text-3xl" />
          <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-[0.14em] text-white/75 sm:gap-4">
            {showCountdown ? <SessionCountdown /> : null}
            <span className="hidden min-w-14 text-right sm:inline">{step}</span>
          </div>
        </header>
        <section className="flex min-h-0 flex-1 flex-col py-[clamp(0.6rem,2dvh,1.6rem)]">
          <div className="mb-[clamp(0.55rem,1.8dvh,1.5rem)] shrink-0">
            {eyebrow ? (
              <p className="mb-1 text-[clamp(0.58rem,1.15dvh,0.75rem)] font-bold uppercase tracking-[0.25em] text-[var(--booth-accent)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-4xl text-[clamp(1.75rem,5dvh,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
              {title}
            </h1>
          </div>
          {children}
        </section>
        <footer className="hidden shrink-0 items-center justify-between border-t border-white/25 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65 min-[900px]:flex [@media(min-height:800px)]:flex">
          <span>Touch-first booth mode</span>
          <span className="inline-flex items-center gap-2">
            <LockKeyhole className="size-3" /> Session stays on this device
          </span>
        </footer>
      </div>
    </main>
  );
}
