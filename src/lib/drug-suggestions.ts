import { generateStructured } from "./gemini";
import { recommendedInterventionsSchema } from "./ai-schemas";
import {
  SYSTEM_RECOMMENDED_INTERVENTIONS,
  buildRecommendedInterventionsUserPrompt,
} from "./ai-prompts";
import type { Patient } from "@/types/patient";
import type { RecommendedInterventionsResponse } from "@/types/ai";

export async function fetchRecommendedInterventions(
  patient: Patient,
): Promise<RecommendedInterventionsResponse> {
  return generateStructured<RecommendedInterventionsResponse>(
    SYSTEM_RECOMMENDED_INTERVENTIONS,
    buildRecommendedInterventionsUserPrompt(patient),
    recommendedInterventionsSchema,
    { model: "gemini-2.5-pro", temperature: 0.1, maxRetries: 2 },
  );
}
