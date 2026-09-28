import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });
const display = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "JJ NJJ Receipt Photobooth", template: "%s | JJ NJJ" },
  description: "A reusable, touch-first receipt photobooth experience.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#7c00ff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} ${display.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
