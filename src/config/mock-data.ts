import type { BoothSession, ReceiptTemplate, ThemePalette } from "@/types";

export const business = {
  name: "JJ NJJ",
  monogram: "JJ NJJ",
  handle: "@jjnjj.studio",
  headerText: "One night. Four frames.",
  footerText: "Keep the proof.",
  customMessage: "Thanks for stepping into our booth.",
};

export const defaultPalette: ThemePalette = {
  primary: "#7C00FF",
  secondary: "#101010",
  background: "#F7F6F2",
  text: "#101010",
  accent: "#D8FF4F",
};

export const templates: ReceiptTemplate[] = [
  { id: "solo", name: "Solo Story", layout: "single", photoSlots: 1, size: "80 × 120 mm", isDefault: false, logoPlacement: "top", palette: defaultPalette },
  { id: "double", name: "Double Take", layout: "double", photoSlots: 2, size: "80 × 180 mm", isDefault: true, logoPlacement: "top", palette: defaultPalette },
  { id: "triple", name: "Three Beats", layout: "triple", photoSlots: 3, size: "80 × 220 mm", isDefault: false, logoPlacement: "top", palette: defaultPalette },
  { id: "quad", name: "Four Frames", layout: "quad", photoSlots: 4, size: "80 × 260 mm", isDefault: false, logoPlacement: "top", palette: defaultPalette },
];

export const sessions: BoothSession[] = [
  { id: "JJ-0928-1842", createdAt: "Sep 28, 2026 · 6:42 PM", template: "Four Frames", photoCount: 4, syncStatus: "synced", image: "/images/booth-friends-02.png" },
  { id: "JJ-0928-1816", createdAt: "Sep 28, 2026 · 6:16 PM", template: "Double Take", photoCount: 2, syncStatus: "pending", image: "/images/booth-friends-01.png" },
  { id: "JJ-0928-1753", createdAt: "Sep 28, 2026 · 5:53 PM", template: "Solo Story", photoCount: 1, syncStatus: "local", image: "/images/booth-friends-02.png" },
  { id: "JJ-0928-1719", createdAt: "Sep 28, 2026 · 5:19 PM", template: "Three Beats", photoCount: 3, syncStatus: "failed", image: "/images/booth-friends-01.png" },
];

export const dashboardStats = [
  { label: "Sessions today", value: "48", detail: "+12 since 5 PM" },
  { label: "Synced", value: "44", detail: "92% of sessions" },
  { label: "Waiting", value: "03", detail: "Will retry online" },
  { label: "Active template", value: "4", detail: "Four Frames" },
];

export const boothImages = ["/images/booth-friends-01.png", "/images/booth-friends-02.png"];
