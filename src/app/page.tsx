import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { StartSessionButton } from "@/components/booth/start-session-button";

export default function Home() {
  return (
    <main className="grain relative min-h-dvh overflow-hidden bg-[var(--booth-primary)] text-white">
      <div className="absolute inset-y-0 left-0 hidden w-24 items-center justify-center border-r border-white/35 md:flex lg:w-32">
        <p className="whitespace-nowrap text-6xl font-black uppercase tracking-[-0.07em] [writing-mode:vertical-rl]">
          Photobooth Receipt
        </p>
      </div>
      <div className="relative z-10 flex min-h-dvh flex-col px-5 py-6 md:ml-24 md:px-10 lg:ml-32 lg:px-16">
        <header className="flex items-center justify-between border-b border-white/35 pb-5">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">Est. 2026 / Manila</span>
          <Link
            href="/admin/login"
            className="text-xs font-bold uppercase tracking-[0.2em] underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-white"
          >
            Admin
          </Link>
        </header>
        <section className="flex flex-1 flex-col justify-between py-10 sm:py-14">
          <BrandMark inverse className="self-center text-6xl sm:text-8xl lg:text-[9rem]" />
          <div className="mt-14 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-4 max-w-sm text-sm font-bold uppercase leading-6 tracking-[0.18em] text-white/75">
                Pick a layout. Strike a pose. Leave with the proof.
              </p>
              <h1 className="max-w-4xl text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[0.77] tracking-[-0.075em]">
                Receipt
                <br />
                Photobooth
              </h1>
            </div>
            <StartSessionButton />
          </div>
        </section>
      </div>
    </main>
  );
}
