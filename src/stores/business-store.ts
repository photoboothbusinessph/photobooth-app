import { create } from "zustand";
import { business, defaultPalette, templates as defaultTemplates } from "@/config/mock-data";
import type { BusinessBranding, ReceiptTemplate, ThemePalette } from "@/types";

interface BusinessState {
  isHydrated: boolean;
  isConfigured: boolean;
  branding: BusinessBranding;
  palette: ThemePalette;
  templates: ReceiptTemplate[];
  logoPublicId: string | null;
  socialUrl: string | null;
  socialQrUrl: string | null;
  socialQrPublicId: string | null;
  setHydrated: (isHydrated: boolean) => void;
  setConfigured: (isConfigured: boolean) => void;
  updateBranding: (branding: Partial<BusinessBranding>) => void;
  updatePalette: (palette: ThemePalette) => void;
  setTemplates: (templates: ReceiptTemplate[]) => void;
  setAssetReferences: (assets: Partial<Pick<BusinessState, "logoPublicId" | "socialUrl" | "socialQrUrl" | "socialQrPublicId">>) => void;
  resetPalette: () => void;
}

const initialBranding: BusinessBranding = { ...business, logoDataUrl: null };

export const useBusinessStore = create<BusinessState>((set) => ({
  isHydrated: false,
  isConfigured: false,
  branding: initialBranding,
  palette: defaultPalette,
  templates: defaultTemplates,
  logoPublicId: null,
  socialUrl: null,
  socialQrUrl: null,
  socialQrPublicId: null,
  setHydrated: (isHydrated) => set({ isHydrated }),
  setConfigured: (isConfigured) => set({ isConfigured }),
  updateBranding: (branding) => set((state) => ({ branding: { ...state.branding, ...branding } })),
  updatePalette: (palette) => set({ palette }),
  setTemplates: (templates) => set({ templates }),
  setAssetReferences: (assets) => set(assets),
  resetPalette: () => set({ palette: defaultPalette }),
}));
