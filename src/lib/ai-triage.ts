import { generateStructured } from "./gemini";
import { triageContextSchema } from "./ai-schemas";
import {
  SYSTEM_TRIAGE_CONTEXT,
  buildTriageContextUserPrompt,
} from "./ai-prompts";
import type { Patient } from "@/types/patient";
import type { TriageContextDecision } from "@/types/ai";
import { startProtocol, type TriageResult } from "./triage";

export async function evaluateTriage(
  patient: Patient,
): Promise<TriageContextDecision> {
  const start = startProtocol(patient);
  return generateStructured<TriageContextDecision>(
    SYSTEM_TRIAGE_CONTEXT,
    buildTriageContextUserPrompt(patient, start.color),
    triageContextSchema,
    { model: "gemini-2.5-pro", temperature: 0.2 },
  );
}

export function startResultFor(patient: Patient): TriageResult {
  return startProtocol(patient);
}
