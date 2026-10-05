import type { ReceiptTemplate, ThemePalette } from "@/types";

export const business = {
  name: "Your Business",
  monogram: "YB",
  logoMode: "text" as const,
  logoFont: "editorial" as const,
  handle: "@yourbusiness",
  headerText: "Pick a layout. Strike a pose.",
  footerText: "Keep the moment.",
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
  {
    id: "solo",
    name: "Solo Story",
    layout: "single",
    photoSlots: 1,
    size: "80 × 120 mm",
    isDefault: false,
    logoPlacement: "top",
    palette: defaultPalette,
  },
  {
    id: "double",
    name: "Double Take",
    layout: "double",
    photoSlots: 2,
    size: "80 × 180 mm",
    isDefault: true,
    logoPlacement: "top",
    palette: defaultPalette,
  },
  {
    id: "triple",
    name: "Three Beats",
    layout: "triple",
    photoSlots: 3,
    size: "80 × 220 mm",
    isDefault: false,
    logoPlacement: "top",
    palette: defaultPalette,
  },
  {
    id: "quad",
    name: "Four Frames",
    layout: "quad",
    photoSlots: 4,
    size: "80 × 260 mm",
    isDefault: false,
    logoPlacement: "top",
    palette: defaultPalette,
  },
];

export const boothImages = ["/images/booth-friends-01.png", "/images/booth-friends-02.png"];
