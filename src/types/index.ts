export type TemplateLayout = "single" | "double" | "triple" | "quad";
export type SyncStatus = "synced" | "pending" | "local" | "failed";

export interface ThemePalette { primary: string; secondary: string; background: string; text: string; accent: string; }

export interface ReceiptTemplate {
  id: string;
  name: string;
  layout: TemplateLayout;
  photoSlots: number;
  size: string;
  isDefault: boolean;
  logoPlacement: "top" | "bottom";
  palette: ThemePalette;
}

export interface BoothSession {
  id: string;
  createdAt: string;
  template: string;
  photoCount: number;
  syncStatus: SyncStatus;
  image: string;
}
