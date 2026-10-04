import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";

export default function OfflinePage() {
  return (
    <main className="grain grid min-h-dvh place-items-center bg-[var(--booth-primary)] p-6 text-white">
      <section className="w-full max-w-xl border-2 border-white p-7 sm:p-10">
        <BrandMark inverse className="text-3xl" />
        <CloudOff className="mt-16 size-12 text-[var(--booth-accent)]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[var(--booth-accent)]">
          Offline mode
        </p>
        <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-7xl">
          Connection unavailable.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-white/75">
          The installed booth can continue using cached screens and locally saved sessions. Online
          sharing will resume when the connection returns.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-14 items-center gap-2 bg-[var(--booth-accent)] px-6 font-black uppercase text-black"
        >
          <RotateCcw className="size-5" /> Return to booth
        </Link>
      </section>
    </main>
  );
}
