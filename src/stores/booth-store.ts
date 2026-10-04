import { create } from "zustand";
import type { BoothStep, CapturedPhoto, PhotoMode } from "@/types";

interface GeneratedReceiptImages {
  color: string;
  bw: string;
}

interface BoothState {
  sessionId: string | null;
  startedAt: number | null;
  step: BoothStep;
  selectedTemplateId: string | null;
  capturedPhotos: CapturedPhoto[];
  previewMode: PhotoMode;
  generatedImages: GeneratedReceiptImages | null;
  shareUrl: string | null;
  shareToken: string | null;
  startSession: () => void;
  selectTemplate: (templateId: string) => void;
  beginCapture: () => void;
  addCapturedPhoto: (dataUrl: string) => void;
  removeCapturedPhoto: (index: number) => void;
  beginReview: () => void;
  setPreviewMode: (mode: PhotoMode) => void;
  setGeneratedImages: (images: GeneratedReceiptImages | null) => void;
  setShareResult: (result: { shareUrl: string; shareToken: string } | null) => void;
  completeSession: () => void;
  resetSession: () => void;
}

const initialState = {
  sessionId: null,
  startedAt: null,
  step: "idle" as BoothStep,
  selectedTemplateId: null,
  capturedPhotos: [] as CapturedPhoto[],
  previewMode: "color" as PhotoMode,
  generatedImages: null,
  shareUrl: null,
  shareToken: null,
};

export const useBoothStore = create<BoothState>((set) => ({
  ...initialState,
  startSession: () => set({
    ...initialState,
    sessionId: crypto.randomUUID(),
    startedAt: Date.now(),
    step: "selecting",
  }),
  selectTemplate: (selectedTemplateId) => set((state) => ({
    selectedTemplateId,
    capturedPhotos: state.selectedTemplateId === selectedTemplateId ? state.capturedPhotos : [],
    generatedImages: null,
  })),
  beginCapture: () => set({ step: "capturing", generatedImages: null }),
  addCapturedPhoto: (dataUrl) => set((state) => ({
    capturedPhotos: [...state.capturedPhotos, { id: crypto.randomUUID(), dataUrl, capturedAt: Date.now() }],
    generatedImages: null,
  })),
  removeCapturedPhoto: (index) => set((state) => ({
    capturedPhotos: state.capturedPhotos.filter((_, photoIndex) => photoIndex !== index),
    generatedImages: null,
  })),
  beginReview: () => set({ step: "reviewing" }),
  setPreviewMode: (previewMode) => set({ previewMode }),
  setGeneratedImages: (generatedImages) => set({ generatedImages }),
  setShareResult: (result) => set({ shareUrl: result?.shareUrl ?? null, shareToken: result?.shareToken ?? null }),
  completeSession: () => set({ step: "complete" }),
  resetSession: () => set(initialState),
}));
