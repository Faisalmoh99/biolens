import { generateStructured } from "./gemini";
import { handoffSummarySchema } from "./ai-schemas";
import {
  SYSTEM_HANDOFF_SUMMARY,
  buildHandoffSummaryUserPrompt,
} from "./ai-prompts";
import type { Patient } from "@/types/patient";
import type { HandoffSummary } from "@/types/ai";

export async function generateHandoffSummary(
  patient: Patient,
): Promise<HandoffSummary> {
  const result = await generateStructured<Omit<HandoffSummary, "etaMin">>(
    SYSTEM_HANDOFF_SUMMARY,
    buildHandoffSummaryUserPrompt(patient),
    handoffSummarySchema,
    { model: "gemini-2.5-flash", temperature: 0.2, maxRetries: 2 },
  );
  return { ...result, etaMin: 0 };
}
