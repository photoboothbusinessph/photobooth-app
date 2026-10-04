import { create } from "zustand";

interface AdminUiState {
  mobileNavigationOpen: boolean;
  setMobileNavigationOpen: (open: boolean) => void;
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
  mobileNavigationOpen: false,
  setMobileNavigationOpen: (mobileNavigationOpen) => set({ mobileNavigationOpen }),
}));
