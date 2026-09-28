import { cn } from "@/lib/utils";

export function BrandMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <div className={cn("display-serif inline-flex items-center text-3xl leading-none tracking-[-0.12em]", inverse ? "text-white" : "text-black", className)} aria-label="JJ NJJ">
      <span>JJ</span><span className="mx-2 inline-block h-px w-8 rotate-45 bg-current" /><span>NJJ</span>
    </div>
  );
}
