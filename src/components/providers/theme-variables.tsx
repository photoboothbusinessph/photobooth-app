"use client";

import * as React from "react";
import { useBusinessStore } from "@/stores/business-store";

const variables = {
  primary: "--booth-primary",
  secondary: "--booth-secondary",
  background: "--booth-background",
  text: "--booth-text",
  accent: "--booth-accent",
} as const;

export function ThemeVariables() {
  const palette = useBusinessStore((state) => state.palette);

  React.useEffect(() => {
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, variable]) => {
      root.style.setProperty(variable, palette[key as keyof typeof variables]);
    });
  }, [palette]);

  return null;
}
