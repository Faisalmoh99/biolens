import { useCallback, useState } from "react";

import { cropToTensor, extractEmbedding } from "@/lib/tensorflow";
import { matchEmbedding, type MatchResult } from "@/lib/matching";
import type { IrisData } from "@/lib/mediapipe";
import {
  playFailBuzz,
  playStageAdvance,
  playSuccessChime,
} from "@/lib/sounds";
import { useAppStore } from "@/store/appStore";

export type MatchingStage =
  | "idle"
  | "capturing"
  | "extracting"
  | "matching"
  | "success"
  | "failed";

export function useIrisMatching() {
  const [stage, setStage] = useState<MatchingStage>("idle");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (video: HTMLVideoElement, iris: IrisData) => {
    try {
      setError(null);
      setStage("capturing");
      playStageAdvance();

      const useRight =
        iris.rightBoundingBox.width >= iris.leftBoundingBox.width;
      const bbox = useRight ? iris.rightBoundingBox : iris.leftBoundingBox;

      await new Promise((r) => setTimeout(r, 350));

      setStage("extracting");
      playStageAdvance();
      const tensor = cropToTensor(
        video,
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
      );
      const embedding = await extractEmbedding(tensor);

      setStage("matching");
      playStageAdvance();
      await new Promise((r) => setTimeout(r, 500));
      const match = await matchEmbedding(embedding);

      setResult(match);
      if (match.isMatch) {
        useAppStore.getState().addMatchToHistory({
          pilgrimId: match.pilgrimId,
          similarity: match.similarity,
        });
        setStage("success");
        playSuccessChime();
      } else {
        setStage("failed");
        playFailBuzz();
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Matching failed";
      setError(message);
      setStage("failed");
      playFailBuzz();
    }
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setError(null);
  }, []);

  return { stage, result, error, run, reset };
}
