import { create } from "zustand";
import { business, defaultPalette, templates as defaultTemplates } from "@/config/mock-data";
import type { BoothPageBackgrounds, BusinessBranding, ReceiptTemplate, ThemePalette } from "@/types";
import { DEFAULT_BOOTH_SESSION_DURATION_SECONDS } from "@/lib/booth-session";
import { DEFAULT_DIGITAL_COPY_QR_LABEL, DEFAULT_PRIMARY_SOCIAL_QR_LABEL, DEFAULT_SECONDARY_SOCIAL_QR_LABEL } from "@/lib/social-qr-settings";

interface BusinessState {
  tenantKey: string | null;
  businessId: string | null;
  businessSlug: string | null;
  isHydrated: boolean;
  isConfigured: boolean;
  branding: BusinessBranding;
  palette: ThemePalette;
  templates: ReceiptTemplate[];
  logoPublicId: string | null;
  socialUrl: string | null;
  socialQrUrl: string | null;
  socialQrPublicId: string | null;
  socialQrLabel: string;
  secondarySocialUrl: string | null;
  secondarySocialQrLabel: string;
  digitalCopyQrLabel: string;
  welcomeBackgroundUrl: string | null;
  welcomeBackgroundPublicId: string | null;
  boothPageBackgrounds: BoothPageBackgrounds;
  boothSessionDurationSeconds: number;
  setHydrated: (isHydrated: boolean) => void;
  setTenantKey: (tenantKey: string | null) => void;
  setBusinessId: (businessId: string | null) => void;
  setBusinessSlug: (businessSlug: string | null) => void;
  resetBusiness: () => void;
  setConfigured: (isConfigured: boolean) => void;
  updateBranding: (branding: Partial<BusinessBranding>) => void;
  updatePalette: (palette: ThemePalette) => void;
  setTemplates: (templates: ReceiptTemplate[]) => void;
  setAssetReferences: (assets: Partial<Pick<BusinessState, "logoPublicId" | "socialUrl" | "socialQrUrl" | "socialQrPublicId" | "socialQrLabel" | "secondarySocialUrl" | "secondarySocialQrLabel" | "digitalCopyQrLabel" | "welcomeBackgroundUrl" | "welcomeBackgroundPublicId" | "boothPageBackgrounds">>) => void;
  setBoothSessionDurationSeconds: (durationSeconds: number) => void;
  resetPalette: () => void;
}

const initialBranding: BusinessBranding = { ...business, logoDataUrl: null };

export const useBusinessStore = create<BusinessState>((set) => ({
  tenantKey: null,
  businessId: null,
  businessSlug: null,
  isHydrated: false,
  isConfigured: false,
  branding: initialBranding,
  palette: defaultPalette,
  templates: defaultTemplates,
  logoPublicId: null,
  socialUrl: null,
  socialQrUrl: null,
  socialQrPublicId: null,
  socialQrLabel: DEFAULT_PRIMARY_SOCIAL_QR_LABEL,
  secondarySocialUrl: null,
  secondarySocialQrLabel: DEFAULT_SECONDARY_SOCIAL_QR_LABEL,
  digitalCopyQrLabel: DEFAULT_DIGITAL_COPY_QR_LABEL,
  welcomeBackgroundUrl: null,
  welcomeBackgroundPublicId: null,
  boothPageBackgrounds: {},
  boothSessionDurationSeconds: DEFAULT_BOOTH_SESSION_DURATION_SECONDS,
  setHydrated: (isHydrated) => set({ isHydrated }),
  setTenantKey: (tenantKey) => set({ tenantKey }),
  setBusinessId: (businessId) => set({ businessId }),
  setBusinessSlug: (businessSlug) => set({ businessSlug }),
  resetBusiness: () => set({ businessId: null, businessSlug: null, isHydrated: false, isConfigured: false, branding: initialBranding, palette: defaultPalette, templates: defaultTemplates, logoPublicId: null, socialUrl: null, socialQrUrl: null, socialQrPublicId: null, socialQrLabel: DEFAULT_PRIMARY_SOCIAL_QR_LABEL, secondarySocialUrl: null, secondarySocialQrLabel: DEFAULT_SECONDARY_SOCIAL_QR_LABEL, digitalCopyQrLabel: DEFAULT_DIGITAL_COPY_QR_LABEL, welcomeBackgroundUrl: null, welcomeBackgroundPublicId: null, boothPageBackgrounds: {}, boothSessionDurationSeconds: DEFAULT_BOOTH_SESSION_DURATION_SECONDS }),
  setConfigured: (isConfigured) => set({ isConfigured }),
  updateBranding: (branding) => set((state) => ({ branding: { ...state.branding, ...branding } })),
  updatePalette: (palette) => set({ palette }),
  setTemplates: (templates) => set({ templates }),
  setAssetReferences: (assets) => set(assets),
  setBoothSessionDurationSeconds: (boothSessionDurationSeconds) => set({ boothSessionDurationSeconds }),
  resetPalette: () => set({ palette: defaultPalette }),
}));
