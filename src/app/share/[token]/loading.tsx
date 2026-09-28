import { Skeleton } from "@/components/ui/skeleton";

export default function ShareLoading() {
  return <main className="min-h-dvh bg-neutral-950 p-5 text-white"><div className="mx-auto grid max-w-5xl gap-10 pt-24 md:grid-cols-2"><Skeleton className="mx-auto aspect-[2/3.35] w-full max-w-[360px] bg-white/10" /><div className="space-y-5 pt-12"><Skeleton className="h-4 w-32 bg-white/10" /><Skeleton className="h-28 w-full bg-white/10" /><Skeleton className="h-14 w-full bg-white/10" /><Skeleton className="h-14 w-full bg-white/10" /></div></div></main>;
}
