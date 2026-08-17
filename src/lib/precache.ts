import { fetchAllPatients } from "./patients";
import { fetchTopFacts } from "./ai-filtering";
import { evaluateTriage } from "./ai-triage";
import { generateSOAPNote } from "./soap";
import {
  buildInteractionCacheKey,
  checkInteractions,
} from "./drug-interactions";
import { fetchRecommendedInterventions } from "./drug-suggestions";
import { useAppStore } from "@/store/appStore";
import type {
  InteractionAnalysis,
  LifeSavingFactsResponse,
  RecommendedInterventionsResponse,
  SOAPNote,
  TriageContextDecision,
} from "@/types/ai";

const PRECACHE_DELAY_MS = 2500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HIGH_RISK_PATIENT_IDS = ["pilgrim_001", "pilgrim_002", "pilgrim_003"];

const DRUG_NAME_REGEX =
  /\b(Atropine|Epinephrine|Adrenaline|Amiodarone|Vasopressin|Lidocaine|Heparin|Morphine|Furosemide|Naloxone|Adenosine|Magnesium|Calcium\s+gluconate|Aspirin|Nitroglycerin|Nitro|Albuterol|Dextrose|D50W|Oxygen)\b/gi;

function extractInterventions(actions: string[]): string[] {
  const found = new Set<string>();
  for (const action of actions) {
    const matches = action.match(DRUG_NAME_REGEX);
    if (!matches) continue;
    for (const m of matches) {
      const normalized = m.toLowerCase();
      if (normalized === "adrenaline") found.add("Epinephrine");
      else if (normalized === "nitro") found.add("Nitroglycerin");
      else if (normalized === "d50w") found.add("Dextrose");
      else {
        const titled = m
          .toLowerCase()
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        found.add(titled);
      }
    }
  }
  return Array.from(found);
}

const PRECACHE_KEY = "biolens-precache-v1";
const PRECACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const PRECACHE_VERSION = 4;

export interface PrecacheData {
  version: 4;
  topFacts: Record<string, LifeSavingFactsResponse>;
  triageDecisions: Record<string, TriageContextDecision>;
  soapNotes: Record<string, SOAPNote>;
  interactionAnalyses: Record<string, InteractionAnalysis>;
  interventionSuggestions: Record<string, RecommendedInterventionsResponse>;
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
      const proposed = extractInterventions(
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

  onProgress?.(1, "Done");
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
    Object.keys(data.interventionSuggestions ?? {}).length
  );
}

export async function loadStaticPrecache(): Promise<PrecacheData | null> {
  try {
    const res = await fetch("/data/ai-precache.json", { cache: "no-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as PrecacheData;
    if ((data.version as number) !== 4) return null;
    return data;
  } catch {
    return null;
  }
}
