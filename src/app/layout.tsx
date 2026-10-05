import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { Bodoni_Moda, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeVariables } from "@/components/providers/theme-variables";
import { OfflineDataProvider } from "@/components/providers/offline-data-provider";
import { NetworkStatus } from "@/components/shared/network-status";
import { SyncProvider } from "@/components/providers/sync-provider";
import { KioskSessionManager } from "@/components/providers/kiosk-session-manager";
import "./globals.css";

const sans = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const display = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Receipt Photobooth",
  title: { default: "Receipt Photobooth", template: "%s | Receipt Photobooth" },
  description: "A reusable, touch-first receipt photobooth experience.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Receipt Booth" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7c00ff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${display.variable}`}>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"}>
          <ThemeVariables />
          <OfflineDataProvider />
          <SyncProvider />
          <KioskSessionManager />
          {children}
          <NetworkStatus />
          <Toaster position="top-center" richColors />
        </SerwistProvider>
      </body>
    </html>
  );
}
