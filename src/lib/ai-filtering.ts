import { generateStructured } from "./gemini";
import { lifeSavingFactsSchema } from "./ai-schemas";
import {
  SYSTEM_LIFE_SAVING_FACTS,
  buildLifeSavingFactsUserPrompt,
} from "./ai-prompts";
import type { Patient } from "@/types/patient";
import type { LifeSavingFactsResponse } from "@/types/ai";

export async function fetchTopFacts(
  patient: Patient,
): Promise<LifeSavingFactsResponse> {
  return generateStructured<LifeSavingFactsResponse>(
    SYSTEM_LIFE_SAVING_FACTS,
    buildLifeSavingFactsUserPrompt(patient),
    lifeSavingFactsSchema,
    { model: "gemini-2.5-flash", temperature: 0.2 },
  );
}
