const BASE = "https://api.fda.gov/drug/label.json";
const CACHE_KEY = "biolens-openfda-cache-v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const ALIASES: Record<string, string> = {
  "acetylsalicylic acid": "aspirin",
  salbutamol: "albuterol",
  paracetamol: "acetaminophen",
  frusemide: "furosemide",
  adrenaline: "epinephrine",
  noradrenaline: "norepinephrine",
  lignocaine: "lidocaine",
  pethidine: "meperidine",
  "glyceryl trinitrate": "nitroglycerin",
  gtn: "nitroglycerin",
  "calcium gluconate": "calcium gluconate",
};

function normalizeName(name: string): string {
  const lower = name.toLowerCase().trim();
  return ALIASES[lower] ?? lower;
}

export interface OpenFDAResult {
  generic: string;
  brandNames: string[];
  warnings: string[];
  contraindications: string[];
  drugInteractions: string[];
  boxedWarning?: string;
}

interface CacheEntry {
  data: OpenFDAResult | null;
  timestamp: number;
}

function loadCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full or disabled */
  }
}

export async function fetchDrugInfo(
  genericName: string,
): Promise<OpenFDAResult | null> {
  const original = genericName;
  const key = normalizeName(genericName);
  if (!key) return null;
  const cache = loadCache();
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) return entry.data;

  const queries = [
    `openfda.generic_name:"${key}"`,
    `openfda.substance_name:"${key}"`,
    `openfda.brand_name:"${key}"`,
  ];

  for (const q of queries) {
    try {
      const url = `${BASE}?search=${encodeURIComponent(q)}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const r = data.results?.[0];
      if (!r) continue;
      const result: OpenFDAResult = {
        generic: original,
        brandNames: r.openfda?.brand_name ?? [],
        warnings: r.warnings ?? [],
        contraindications: r.contraindications ?? [],
        drugInteractions: r.drug_interactions ?? [],
        boxedWarning: r.boxed_warning?.[0],
      };
      cache[key] = { data: result, timestamp: Date.now() };
      saveCache(cache);
      return result;
    } catch {
      continue;
    }
  }

  cache[key] = { data: null, timestamp: Date.now() };
  saveCache(cache);
  return null;
}

export async function fetchMultipleDrugs(
  generics: string[],
): Promise<Map<string, OpenFDAResult | null>> {
  const results = new Map<string, OpenFDAResult | null>();
  const chunks: string[][] = [];
  for (let i = 0; i < generics.length; i += 5) {
    chunks.push(generics.slice(i, i + 5));
  }
  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map((g) => fetchDrugInfo(g)),
    );
    chunk.forEach((g, i) => {
      const s = settled[i];
      results.set(g, s.status === "fulfilled" ? s.value : null);
    });
  }
  return results;
}
