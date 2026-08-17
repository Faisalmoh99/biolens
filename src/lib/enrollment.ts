import { extractEmbeddingFromImage } from "./tensorflow";
import { generateSyntheticIris } from "./iris-refs";

export interface EnrolledEmbedding {
  pilgrimId: string;
  vector: number[];
  source: "real" | "synthetic";
}

const STORAGE_KEY = "biolens-enrolled-embeddings-v1";
const PILGRIM_IDS = [
  "pilgrim_001",
  "pilgrim_002",
  "pilgrim_003",
  "pilgrim_004",
  "pilgrim_005",
];

let inFlight: Promise<EnrolledEmbedding[]> | null = null;

export async function enrollAll(): Promise<EnrolledEmbedding[]> {
  const cached = readCache();
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const enrolled: EnrolledEmbedding[] = [];
    for (let i = 0; i < PILGRIM_IDS.length; i++) {
      const id = PILGRIM_IDS[i];
      let vector: Float32Array;
      let source: "real" | "synthetic" = "real";
      try {
        vector = await extractEmbeddingFromImage(`/data/iris_refs/${id}.jpg`);
      } catch {
        const dataUrl = generateSyntheticIris(i + 1);
        vector = await extractEmbeddingFromImage(dataUrl);
        source = "synthetic";
      }
      enrolled.push({ pilgrimId: id, vector: Array.from(vector), source });
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enrolled));
    } catch {
      // localStorage may be full or disabled — ignore
    }
    return enrolled;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export async function getEnrolledEmbeddings(): Promise<EnrolledEmbedding[]> {
  return enrollAll();
}

export function clearEnrollmentCache() {
  localStorage.removeItem(STORAGE_KEY);
}

function readCache(): EnrolledEmbedding[] | null {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) return null;
  try {
    const parsed = JSON.parse(cached) as EnrolledEmbedding[];
    if (Array.isArray(parsed) && parsed.length === PILGRIM_IDS.length) {
      return parsed;
    }
  } catch {
    // fall through and regenerate
  }
  return null;
}

if (typeof window !== "undefined") {
  (window as unknown as { clearEnrollmentCache?: () => void }).clearEnrollmentCache =
    clearEnrollmentCache;
}
