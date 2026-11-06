import { fetchAllPatients } from "./patients";
import { fetchTopFacts } from "./ai-filtering";
import { evaluateTriage } from "./ai-triage";
import { generateSOAPNote } from "./soap";
import {
  buildInteractionCacheKey,
  checkInteractions,
  defaultProposedInterventions,
  extractInterventionsFromActions,
} from "./drug-interactions";
import { fetchRecommendedInterventions } from "./drug-suggestions";
import { generateHandoffSummary } from "./hospital-handoff";
import { translateFacts, type LangCode } from "./translation";
import { useAppStore } from "@/store/appStore";
import type {
  HandoffSummary,
  InteractionAnalysis,
  LifeSavingFactsResponse,
  RecommendedInterventionsResponse,
  SOAPNote,
  TriageContextDecision,
} from "@/types/ai";

const PRECACHE_DELAY_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HIGH_RISK_PATIENT_IDS = ["pilgrim_001", "pilgrim_002", "pilgrim_003"];

const PRECACHE_KEY = "biolens-precache-v1";
const PRECACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PRECACHE_VERSION = 5;

/** Languages the facts translation is pre-generated into (UI originals are EN). */
const TRANSLATION_TARGETS: LangCode[] = ["ar"];
const INTERACTION_GAP_PATIENT_IDS = ["pilgrim_004", "pilgrim_005"];

export interface PrecacheData {
  version: 5;
  topFacts: Record<string, LifeSavingFactsResponse>;
  triageDecisions: Record<string, TriageContextDecision>;
  soapNotes: Record<string, SOAPNote>;
  interactionAnalyses: Record<string, InteractionAnalysis>;
  interventionSuggestions: Record<string, RecommendedInterventionsResponse>;
  handoffSummaries?: Record<string, HandoffSummary>;
  factsTranslations?: Record<
    string,
    Partial<Record<LangCode, LifeSavingFactsResponse>>
  >;
  timestamp: number;
}

export type CacheSource = "memory" | "static" | "none";
let currentCacheSource: CacheSource = "none";
export function getCacheSource(): CacheSource {
  return currentCacheSource;
}
export function setCacheSource(s: CacheSource): void {
  currentCacheSource = s;
}

export type PrecacheProgress = (pct: number, label: string) => void;

export async function buildPrecache(
  onProgress?: PrecacheProgress,
): Promise<PrecacheData> {
  const patients = await fetchAllPatients();
  const data: PrecacheData = {
    version: PRECACHE_VERSION,
    topFacts: {},
    triageDecisions: {},
    soapNotes: {},
    interactionAnalyses: {},
    interventionSuggestions: {},
    handoffSummaries: {},
    factsTranslations: {},
    timestamp: Date.now(),
  };
  const highRisk = patients.filter((p) => HIGH_RISK_PATIENT_IDS.includes(p.id));
  const total = patients.length * 4 + highRisk.length;
  let done = 0;
  let isFirstCall = true;

  for (const p of patients) {
    if (!isFirstCall) await sleep(PRECACHE_DELAY_MS);
    isFirstCall = false;
    onProgress?.(done / total, `Top 3 facts for ${p.fullName.en}…`);
    data.topFacts[p.id] = await fetchTopFacts(p);
    done++;

    await sleep(PRECACHE_DELAY_MS);
    onProgress?.(done / total, `Triage decision for ${p.fullName.en}…`);
    data.triageDecisions[p.id] = await evaluateTriage(p);
    done++;

    await sleep(PRECACHE_DELAY_MS);
    onProgress?.(done / total, `SOAP note for ${p.fullName.en}…`);
    const intervention =
      data.triageDecisions[p.id].immediateActions.join(". ") + ".";
    data.soapNotes[p.id] = await generateSOAPNote(p, intervention);
    done++;

    await sleep(PRECACHE_DELAY_MS);
    onProgress?.(done / total, `Drug suggestions for ${p.fullName.en}…`);
    data.interventionSuggestions[p.id] = await fetchRecommendedInterventions(p);
    done++;
  }

  for (const p of highRisk) {
    await sleep(PRECACHE_DELAY_MS);
    onProgress?.(done / total, `Drug interactions for ${p.fullName.en}…`);
    try {
      const proposed = extractInterventionsFromActions(
        data.triageDecisions[p.id]?.immediateActions ?? [],
      );
      if (proposed.length > 0) {
        const currentMeds = p.medications.map((m) => m.generic);
        const analysis = await checkInteractions(currentMeds, proposed);
        const key = buildInteractionCacheKey(p.id, proposed);
        data.interactionAnalyses[key] = analysis;
      }
    } catch (err) {
      console.error(`[precache] interactions failed for ${p.id}`, err);
    }
    done++;
  }

  // Handoff summaries, translations and 004/005 interactions.
  return extendPrecache(data, onProgress);
}

/**
 * Fill only the buckets that are missing from `base` (handoff summaries,
 * facts translations, interactions for patients whose triage names no drug).
 * Existing entries are preserved untouched. Result is stamped with the
 * current version and saved to localStorage so Director → Export works.
 *
 * Gemini calls = missing handoffs + missing translations + missing
 * interaction analyses (one each).
 */
export async function extendPrecache(
  base: PrecacheData,
  onProgress?: PrecacheProgress,
): Promise<PrecacheData> {
  const patients = await fetchAllPatients();
  const data: PrecacheData = {
    ...base,
    version: PRECACHE_VERSION,
    interactionAnalyses: { ...(base.interactionAnalyses ?? {}) },
    interventionSuggestions: { ...(base.interventionSuggestions ?? {}) },
    handoffSummaries: { ...(base.handoffSummaries ?? {}) },
    factsTranslations: { ...(base.factsTranslations ?? {}) },
  };
  const handoffs = data.handoffSummaries!;
  const translations = data.factsTranslations!;

  type Job = { label: string; run: () => Promise<void> };
  const jobs: Job[] = [];

  for (const p of patients) {
    if (!handoffs[p.id]) {
      jobs.push({
        label: `Handoff summary for ${p.fullName.en}…`,
        run: async () => {
          handoffs[p.id] = await generateHandoffSummary(p);
        },
      });
    }
  }

  for (const p of patients) {
    const facts = data.topFacts[p.id];
    if (!facts) continue;
    for (const lang of TRANSLATION_TARGETS) {
      if (translations[p.id]?.[lang]) continue;
      jobs.push({
        label: `Translate facts (${lang}) for ${p.fullName.en}…`,
        run: async () => {
          const translated = await translateFacts(facts, lang);
          translations[p.id] = { ...(translations[p.id] ?? {}), [lang]: translated };
        },
      });
    }
  }

  for (const p of patients) {
    if (!INTERACTION_GAP_PATIENT_IDS.includes(p.id)) continue;
    const proposed = defaultProposedInterventions(
      data.triageDecisions[p.id]?.immediateActions ?? [],
      data.interventionSuggestions[p.id]?.interventions,
    );
    if (proposed.length === 0) continue;
    const key = buildInteractionCacheKey(p.id, proposed);
    if (data.interactionAnalyses[key]) continue;
    jobs.push({
      label: `Drug interactions for ${p.fullName.en}…`,
      run: async () => {
        const currentMeds = p.medications.map((m) => m.generic);
        data.interactionAnalyses[key] = await checkInteractions(
          currentMeds,
          proposed,
        );
      },
    });
  }

  // A failed job is logged and skipped so completed results are kept; a
  // re-run (from the saved localStorage copy) only retries what's missing.
  let failed = 0;
  for (let i = 0; i < jobs.length; i++) {
    if (i > 0) await sleep(PRECACHE_DELAY_MS);
    onProgress?.(i / jobs.length, jobs[i].label);
    try {
      await jobs[i].run();
      // Checkpoint after every call so a reload never loses paid results.
      try {
        localStorage.setItem(PRECACHE_KEY, JSON.stringify(data));
      } catch {
        /* storage full or disabled */
      }
    } catch (err) {
      failed++;
      console.error(`[precache] ${jobs[i].label} failed`, err);
    }
  }

  data.timestamp = Date.now();
  onProgress?.(1, failed ? `Done · ${failed} failed` : "Done");
  try {
    localStorage.setItem(PRECACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or disabled */
  }
  return data;
}

export function loadPrecache(): PrecacheData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PRECACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PrecacheData;
  } catch {
    return null;
  }
}

export function isPrecacheFresh(data: PrecacheData | null): boolean {
  if (!data) return false;
  if ((data.version as number) !== PRECACHE_VERSION) return false;
  return Date.now() - data.timestamp < PRECACHE_MAX_AGE_MS;
}

export function hydrateStoresFromPrecache(data: PrecacheData): void {
  const store = useAppStore.getState();
  for (const [id, facts] of Object.entries(data.topFacts)) {
    store.setTopFacts(id, facts);
  }
  for (const [id, decision] of Object.entries(data.triageDecisions)) {
    store.setTriageDecision(id, decision);
  }
  for (const [id, note] of Object.entries(data.soapNotes)) {
    store.setSOAPNote(id, note);
  }
  for (const [key, analysis] of Object.entries(
    data.interactionAnalyses ?? {},
  )) {
    store.setInteractionAnalysis(key, analysis);
  }
  for (const [pilgrimId, response] of Object.entries(
    data.interventionSuggestions ?? {},
  )) {
    store.setInterventionSuggestions(pilgrimId, response);
  }
  for (const [pilgrimId, summary] of Object.entries(
    data.handoffSummaries ?? {},
  )) {
    store.setHandoffSummary(pilgrimId, summary);
  }
  for (const [pilgrimId, byLang] of Object.entries(
    data.factsTranslations ?? {},
  )) {
    for (const [lang, facts] of Object.entries(byLang ?? {})) {
      if (facts) store.setFactsTranslation(pilgrimId, lang as LangCode, facts);
    }
  }
}

export function clearPrecache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PRECACHE_KEY);
}

export function precacheEntryCount(data: PrecacheData | null): number {
  if (!data) return 0;
  return (
    Object.keys(data.topFacts).length +
    Object.keys(data.triageDecisions).length +
    Object.keys(data.soapNotes).length +
    Object.keys(data.interactionAnalyses ?? {}).length +
    Object.keys(data.interventionSuggestions ?? {}).length +
    Object.keys(data.handoffSummaries ?? {}).length +
    Object.values(data.factsTranslations ?? {}).reduce(
      (n, byLang) => n + Object.keys(byLang ?? {}).length,
      0,
    )
  );
}

/**
 * Fetch the precache shipped in /public. `acceptVersions` lets the one-time
 * gap-fill read an older file as its base; normal boot accepts only the
 * current version.
 */
export async function loadStaticPrecache(
  acceptVersions: number[] = [PRECACHE_VERSION],
): Promise<PrecacheData | null> {
  try {
    const res = await fetch("/data/ai-precache.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as PrecacheData;
    if (!acceptVersions.includes(data.version as number)) return null;
    return data;
  } catch {
    return null;
  }
}
