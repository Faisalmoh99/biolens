import { create } from "zustand";
import type {
  HandoffSummary,
  InteractionAnalysis,
  LifeSavingFactsResponse,
  RecommendedInterventionsResponse,
  SOAPNote,
  TriageContextDecision,
} from "@/types/ai";
import type { LangCode } from "@/lib/translation";

export type ScanMode = "live" | "demo";

const SOUND_STORAGE_KEY = "biolens-sound";

function readInitialSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function persistSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore storage errors
  }
}

interface AppState {
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;
  scanMode: ScanMode;
  setScanMode: (mode: ScanMode) => void;
  demoTargetPilgrimId: string | null;
  setDemoTargetPilgrimId: (id: string | null) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentPatientId: string | null;
  setCurrentPatientId: (id: string | null) => void;
  topFactsCache: Record<string, LifeSavingFactsResponse>;
  setTopFacts: (pilgrimId: string, facts: LifeSavingFactsResponse) => void;
  clearTopFactsCache: () => void;
  triageDecisions: Record<string, TriageContextDecision>;
  setTriageDecision: (pilgrimId: string, decision: TriageContextDecision) => void;
  clearTriageDecisions: () => void;
  factsTranslationCache: Record<
    string,
    Partial<Record<LangCode, LifeSavingFactsResponse>>
  >;
  setFactsTranslation: (
    pilgrimId: string,
    lang: LangCode,
    facts: LifeSavingFactsResponse,
  ) => void;
  soapCache: Record<string, SOAPNote>;
  setSOAPNote: (pilgrimId: string, note: SOAPNote) => void;
  clearSOAPCache: () => void;
  interactionCache: Record<string, InteractionAnalysis>;
  setInteractionAnalysis: (key: string, analysis: InteractionAnalysis) => void;
  clearInteractionCache: () => void;
  interventionSuggestionsCache: Record<string, RecommendedInterventionsResponse>;
  setInterventionSuggestions: (
    pilgrimId: string,
    response: RecommendedInterventionsResponse,
  ) => void;
  clearInterventionSuggestionsCache: () => void;
  handoffSummaryCache: Record<string, HandoffSummary>;
  setHandoffSummary: (pilgrimId: string, summary: HandoffSummary) => void;
  clearHandoffCache: () => void;
  handoffLog: Record<
    string,
    { hospitalId: string; hospitalName: string; sentAt: number; etaMin: number }
  >;
  logHandoff: (
    pilgrimId: string,
    entry: { hospitalId: string; hospitalName: string; etaMin: number },
  ) => void;
  directorMode: boolean;
  setDirectorMode: (on: boolean) => void;
  toggleDirectorMode: () => void;
  showSpeakerNotes: boolean;
  setShowSpeakerNotes: (on: boolean) => void;
  geminiCallCount: number;
  incrementGeminiCallCount: () => void;
  resetGeminiCallCount: () => void;
  matchHistory: { pilgrimId: string; similarity: number; timestamp: number }[];
  addMatchToHistory: (entry: { pilgrimId: string; similarity: number }) => void;
  clearMatchHistory: () => void;
  sessionStartTime: number;
}

const MATCH_HISTORY_LIMIT = 50;

export const useAppStore = create<AppState>((set) => ({
  language: "ar",
  setLanguage: (lang) => set({ language: lang }),
  scanMode: "demo",
  setScanMode: (mode) => set({ scanMode: mode }),
  demoTargetPilgrimId: "pilgrim_001",
  setDemoTargetPilgrimId: (id) => set({ demoTargetPilgrimId: id }),
  soundEnabled: readInitialSoundEnabled(),
  setSoundEnabled: (enabled) => {
    persistSoundEnabled(enabled);
    set({ soundEnabled: enabled });
  },
  currentPatientId: null,
  setCurrentPatientId: (id) => set({ currentPatientId: id }),
  topFactsCache: {},
  setTopFacts: (pilgrimId, facts) =>
    set((state) => ({
      topFactsCache: { ...state.topFactsCache, [pilgrimId]: facts },
    })),
  clearTopFactsCache: () => set({ topFactsCache: {} }),
  triageDecisions: {},
  setTriageDecision: (pilgrimId, decision) =>
    set((state) => ({
      triageDecisions: { ...state.triageDecisions, [pilgrimId]: decision },
    })),
  clearTriageDecisions: () => set({ triageDecisions: {} }),
  factsTranslationCache: {},
  setFactsTranslation: (pilgrimId, lang, facts) =>
    set((state) => ({
      factsTranslationCache: {
        ...state.factsTranslationCache,
        [pilgrimId]: {
          ...(state.factsTranslationCache[pilgrimId] ?? {}),
          [lang]: facts,
        },
      },
    })),
  soapCache: {},
  setSOAPNote: (pilgrimId, note) =>
    set((state) => ({
      soapCache: { ...state.soapCache, [pilgrimId]: note },
    })),
  clearSOAPCache: () => set({ soapCache: {} }),
  interactionCache: {},
  setInteractionAnalysis: (key, analysis) =>
    set((state) => ({
      interactionCache: { ...state.interactionCache, [key]: analysis },
    })),
  clearInteractionCache: () => set({ interactionCache: {} }),
  interventionSuggestionsCache: {},
  setInterventionSuggestions: (pilgrimId, response) =>
    set((state) => ({
      interventionSuggestionsCache: {
        ...state.interventionSuggestionsCache,
        [pilgrimId]: response,
      },
    })),
  clearInterventionSuggestionsCache: () =>
    set({ interventionSuggestionsCache: {} }),
  handoffSummaryCache: {},
  setHandoffSummary: (pilgrimId, summary) =>
    set((state) => ({
      handoffSummaryCache: {
        ...state.handoffSummaryCache,
        [pilgrimId]: summary,
      },
    })),
  clearHandoffCache: () => set({ handoffSummaryCache: {} }),
  handoffLog: {},
  logHandoff: (pilgrimId, entry) =>
    set((state) => ({
      handoffLog: {
        ...state.handoffLog,
        [pilgrimId]: { ...entry, sentAt: Date.now() },
      },
    })),
  directorMode: false,
  setDirectorMode: (on) => set({ directorMode: on }),
  toggleDirectorMode: () =>
    set((state) => ({ directorMode: !state.directorMode })),
  showSpeakerNotes: false,
  setShowSpeakerNotes: (on) => set({ showSpeakerNotes: on }),
  geminiCallCount: 0,
  incrementGeminiCallCount: () =>
    set((state) => ({ geminiCallCount: state.geminiCallCount + 1 })),
  resetGeminiCallCount: () => set({ geminiCallCount: 0 }),
  matchHistory: [],
  addMatchToHistory: (entry) =>
    set((state) => {
      const next = [
        ...state.matchHistory,
        { ...entry, timestamp: Date.now() },
      ];
      if (next.length > MATCH_HISTORY_LIMIT) {
        next.splice(0, next.length - MATCH_HISTORY_LIMIT);
      }
      return { matchHistory: next };
    }),
  clearMatchHistory: () => set({ matchHistory: [] }),
  sessionStartTime: Date.now(),
}));
