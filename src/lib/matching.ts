import { cosineSimilarity } from "./cosine";
import { getEnrolledEmbeddings } from "./enrollment";
import { MATCH_THRESHOLD } from "./constants";
import { useAppStore } from "@/store/appStore";

const DEMO_BASELINE_SIMILARITY: Record<string, number> = {
  pilgrim_001: 0.967,
  pilgrim_002: 0.943,
  pilgrim_003: 0.981,
  pilgrim_004: 0.952,
  pilgrim_005: 0.928,
};

export interface MatchResult {
  pilgrimId: string;
  similarity: number;
  isMatch: boolean;
  ranking: { pilgrimId: string; similarity: number }[];
}

export async function matchEmbedding(query: Float32Array): Promise<MatchResult> {
  const enrolled = await getEnrolledEmbeddings();
  const ranking = enrolled
    .map((e) => ({
      pilgrimId: e.pilgrimId,
      similarity: cosineSimilarity(query, e.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  const scanMode = useAppStore.getState().scanMode;
  const demoTarget = useAppStore.getState().demoTargetPilgrimId;

  if (scanMode === "demo" && demoTarget) {
    const target =
      ranking.find((r) => r.pilgrimId === demoTarget) ?? ranking[0];
    return {
      pilgrimId: target.pilgrimId,
      similarity: DEMO_BASELINE_SIMILARITY[target.pilgrimId] ?? 0.93,
      isMatch: true,
      ranking,
    };
  }

  const top = ranking[0];
  return {
    pilgrimId: top.pilgrimId,
    similarity: top.similarity,
    isMatch: top.similarity >= MATCH_THRESHOLD,
    ranking,
  };
}
