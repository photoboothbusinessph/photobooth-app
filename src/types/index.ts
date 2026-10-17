export type TemplateLayout = "single" | "double" | "triple" | "quad";
export type PhotoSlotCount = 1 | 2 | 3 | 4;
export type ReceiptDesignStyle = "classic" | "calendar" | "social-post" | "barcode" | "flight-ticket";
export type SyncStatus = "synced" | "pending" | "local" | "failed";

export interface ThemePalette { primary: string; secondary: string; background: string; text: string; accent: string; }

export interface BusinessBranding {
  name: string;
  monogram: string;
  logoMode?: "image" | "text";
  logoFont?: "editorial" | "sans" | "mono";
  logoColor?: string;
  handle: string;
  headerText?: string;
  footerText: string;
  customMessage?: string;
  logoDataUrl: string | null;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  capturedAt: number;
}

export type BoothStep = "idle" | "selecting" | "capturing" | "designing" | "reviewing" | "complete";
export type PhotoMode = "color" | "bw";

export interface ReceiptTemplate {
  id: string;
  name: string;
  layout: TemplateLayout;
  photoSlots: number;
  supportedPhotoSlots?: PhotoSlotCount[];
  size: string;
  isDefault: boolean;
  logoPlacement: "top" | "bottom";
  palette: ThemePalette;
  designMode?: "generated" | "image-overlay";
  designStyle?: ReceiptDesignStyle;
  builtIn?: boolean;
  overlayImageUrl?: string | null;
  overlayPublicId?: string | null;
}

export interface BoothSession {
  id: string;
  createdAt: string;
  template: string;
  photoCount: number;
  syncStatus: SyncStatus;
  image: string;
}

export interface PublicShareData {
  sessionId: string;
  colorImageUrl: string;
  bwImageUrl: string;
  createdAt: string;
  branding: BusinessBranding;
  socialQrUrl: string | null;
  socialUrl: string | null;
}
