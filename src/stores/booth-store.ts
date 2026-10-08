import { create } from "zustand";
import { BOOTH_SESSION_DURATION_SECONDS } from "@/lib/booth-session";
import { photoboothDb, type LocalBoothDraft } from "@/lib/db/indexed-db";
import type { BoothStep, CapturedPhoto, PhotoMode } from "@/types";

interface GeneratedReceiptImages {
  color: string;
  bw: string;
}

interface BoothState {
  tenantKey: string | null;
  businessId: string | null;
  isHydrated: boolean;
  persistenceError: string | null;
  sessionId: string | null;
  startedAt: number | null;
  step: BoothStep;
  selectedTemplateId: string | null;
  capturedPhotos: CapturedPhoto[];
  previewMode: PhotoMode;
  generatedImages: GeneratedReceiptImages | null;
  shareUrl: string | null;
  shareToken: string | null;
  hydrateSession: (tenantKey: string) => Promise<void>;
  startSession: (tenantKey: string, businessId: string) => void;
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

const sessionState = {
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

let draftWriteQueue: Promise<void> = Promise.resolve();
let hydrationVersion = 0;

function snapshotDraft(state: BoothState): LocalBoothDraft | null {
  if (!state.tenantKey || !state.businessId || !state.sessionId || !state.startedAt) return null;
  return {
    tenantKey: state.tenantKey,
    businessId: state.businessId,
    sessionId: state.sessionId,
    startedAt: state.startedAt,
    step: state.step,
    selectedTemplateId: state.selectedTemplateId,
    capturedPhotos: state.capturedPhotos,
    previewMode: state.previewMode,
    generatedImages: state.generatedImages,
    shareUrl: state.shareUrl,
    shareToken: state.shareToken,
    updatedAt: Date.now(),
  };
}

function queueDraftWrite(state: BoothState) {
  const draft = snapshotDraft(state);
  if (!draft) return draftWriteQueue;
  draftWriteQueue = draftWriteQueue
    .catch(() => undefined)
    .then(() => photoboothDb.boothDrafts.put(draft).then(() => undefined));
  return draftWriteQueue;
}

function queueDraftRemoval(tenantKey: string) {
  draftWriteQueue = draftWriteQueue
    .catch(() => undefined)
    .then(() => photoboothDb.boothDrafts.delete(tenantKey));
  return draftWriteQueue;
}

export function flushBoothSessionPersistence() {
  return draftWriteQueue.then(() => true, () => false);
}

export const useBoothStore = create<BoothState>((set, get) => {
  function commit(update: Partial<BoothState> | ((state: BoothState) => Partial<BoothState>)) {
    set(update);
    void queueDraftWrite(get()).then(
      () => set({ persistenceError: null }),
      () => set({ persistenceError: "Browser storage is unavailable. Free some device space and try again." }),
    );
  }

  return {
    tenantKey: null,
    businessId: null,
    isHydrated: false,
    persistenceError: null,
    ...sessionState,
    hydrateSession: async (tenantKey) => {
      const current = get();
      if (current.isHydrated && current.tenantKey === tenantKey) return;
      const version = ++hydrationVersion;
      set({ ...sessionState, businessId: null, isHydrated: false, tenantKey });
      try {
        await flushBoothSessionPersistence().catch(() => undefined);
        const draft = await photoboothDb.boothDrafts.get(tenantKey);
        if (version !== hydrationVersion) return;
        const settings = await photoboothDb.businessSettings.get(tenantKey);
        if (version !== hydrationVersion) return;
        const isActive = draft && settings?.identityVerified && draft.businessId === settings.businessId
          && (draft.step === "complete" || Date.now() - draft.startedAt < BOOTH_SESSION_DURATION_SECONDS * 1000);
        if (draft && isActive) {
          set({ ...draft, isHydrated: true });
          return;
        }
        if (draft) await queueDraftRemoval(tenantKey);
      } catch {
        // Continue with a clean session if browser storage is unavailable.
      }
      if (version === hydrationVersion) set({ tenantKey, businessId: null, isHydrated: true, ...sessionState });
    },
    startSession: (tenantKey, businessId) => commit({
      ...sessionState,
      tenantKey,
      businessId,
      isHydrated: true,
      sessionId: crypto.randomUUID(),
      startedAt: Date.now(),
      step: "selecting",
    }),
    selectTemplate: (selectedTemplateId) => commit((state) => ({
      selectedTemplateId,
      capturedPhotos: state.selectedTemplateId === selectedTemplateId ? state.capturedPhotos : [],
      generatedImages: null,
    })),
    beginCapture: () => commit({ step: "capturing", generatedImages: null }),
    addCapturedPhoto: (dataUrl) => commit((state) => ({
      capturedPhotos: [...state.capturedPhotos, { id: crypto.randomUUID(), dataUrl, capturedAt: Date.now() }],
      generatedImages: null,
    })),
    removeCapturedPhoto: (index) => commit((state) => ({
      capturedPhotos: state.capturedPhotos.filter((_, photoIndex) => photoIndex !== index),
      generatedImages: null,
    })),
    beginReview: () => commit({ step: "reviewing" }),
    setPreviewMode: (previewMode) => commit({ previewMode }),
    setGeneratedImages: (generatedImages) => commit({ generatedImages }),
    setShareResult: (result) => commit({ shareUrl: result?.shareUrl ?? null, shareToken: result?.shareToken ?? null }),
    completeSession: () => commit({ step: "complete" }),
    resetSession: () => {
      const { tenantKey } = get();
      set({ tenantKey, businessId: null, isHydrated: true, ...sessionState });
      if (tenantKey) void queueDraftRemoval(tenantKey).catch(() => set({ persistenceError: "The saved draft could not be cleared." }));
    },
  };
});
