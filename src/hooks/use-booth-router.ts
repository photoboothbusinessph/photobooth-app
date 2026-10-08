"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { boothBasePath } from "@/lib/booth-path";

// Guest steps are bundled together; navigation must not fetch server payloads.
export function useBoothRouter() {
  const router = useRouter();
  return useMemo(() => {
    function navigate(href: string, replace: boolean) {
      const base = boothBasePath(window.location.pathname);
      const destination = new URL(href, window.location.origin);
      const localStep =
        destination.pathname === base ||
        /^\/booth\/(templates|camera|preview|photo-qr|social)$/.test(
          destination.pathname.slice(base.length),
        );
      if (
        base &&
        destination.origin === window.location.origin &&
        destination.pathname.startsWith(base) &&
        localStep
      ) {
        window.history[replace ? "replaceState" : "pushState"](null, "", href);
        window.scrollTo(0, 0);
      } else {
        router[replace ? "replace" : "push"](href);
      }
    }
    return {
      push: (href: string) => navigate(href, false),
      replace: (href: string) => navigate(href, true),
    };
  }, [router]);
}
