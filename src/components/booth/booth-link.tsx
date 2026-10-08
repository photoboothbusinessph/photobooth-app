"use client";

import type { ComponentProps } from "react";
import { useBoothRouter } from "@/hooks/use-booth-router";

export function BoothLink({ href, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  const router = useBoothRouter();
  return <a {...props} href={href} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    event.preventDefault();
    router.push(href);
  }} />;
}
