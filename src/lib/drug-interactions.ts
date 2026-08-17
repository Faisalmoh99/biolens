import { generateStructured } from "./gemini";
import { interactionAnalysisSchema } from "./ai-schemas";
import { fetchMultipleDrugs } from "./openfda";
import type { InteractionAnalysis } from "@/types/ai";

const SYSTEM_INTERACTIONS = `You are a clinical pharmacology AI assistant for emergency medicine in the field. You are given:
1. The patient's CURRENT home medications
2. PROPOSED interventions the paramedic is considering
3. openFDA label excerpts for both lists (may be partial or empty for some drugs)

Your job: identify ALL clinically significant drug-drug interactions between current meds and proposed interventions. Be precise. Cite the FDA label when applicable; otherwise rely on established pharmacology knowledge and mark sourceLabel as 'AI-knowledge'.

Rules:
- Only return interactions with REAL clinical significance — skip theoretical or negligible ones
- "contraindicated" = do not co-administer under any circumstance
- "major" = significant risk, requires intervention/monitoring
- "moderate" = clinically relevant, adjust dosing or monitor
- "minor" = noted but rarely actionable
- mechanism ≤ 200 chars, clinicalEffect ≤ 150 chars, recommendation ≤ 150 chars
- Always include both drugs by their generic name
- If no significant interactions exist, return empty alerts array (NOT a fake "minor" alert)`;

export async function checkInteractions(
  currentMeds: string[],
  proposedInterventions: string[],
): Promise<InteractionAnalysis> {
  const normalizedCurrent = Array.from(
    new Set(currentMeds.map((d) => d.toLowerCase().trim()).filter(Boolean)),
  );
  const normalizedProposed = Array.from(
    new Set(
      proposedInterventions.map((d) => d.toLowerCase().trim()).filter(Boolean),
    ),
  );
  const allGenerics = Array.from(
    new Set([...normalizedCurrent, ...normalizedProposed]),
  );

  const fdaResults = await fetchMultipleDrugs(allGenerics);

  const drugsFound = Array.from(fdaResults.entries())
    .filter(([, v]) => v !== null)
    .map(([k]) => k);
  const drugsNotFound = Array.from(fdaResults.entries())
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  const fdaContext = drugsFound
    .map((g) => {
      const r = fdaResults.get(g)!;
      const interactions = (r.drugInteractions[0] ?? "").slice(0, 600);
      const contraindications = (r.contraindications[0] ?? "").slice(0, 300);
      return `## ${g.toUpperCase()}\nContraindications: ${
        contraindications || "none listed"
      }\nInteractions: ${interactions || "none listed"}`;
    })
    .join("\n\n");

  const userPrompt = `PATIENT'S CURRENT MEDICATIONS:\n${currentMeds.join(
    ", ",
  )}\n\nPROPOSED INTERVENTIONS:\n${proposedInterventions.join(
    ", ",
  )}\n\nOPENFDA LABEL EXCERPTS:\n${
    fdaContext || "(no FDA data available — rely on pharmacology knowledge)"
  }\n\nDRUGS NOT FOUND IN FDA: ${
    drugsNotFound.join(", ") || "none"
  }\n\nAnalyze all clinically significant interactions between current meds and proposed interventions. Return structured JSON.`;

  const analysis = await generateStructured<InteractionAnalysis>(
    SYSTEM_INTERACTIONS,
    userPrompt,
    interactionAnalysisSchema,
    { model: "gemini-2.5-pro", temperature: 0.1, maxRetries: 2 },
  );

  return analysis;
}

export function buildInteractionCacheKey(
  pilgrimId: string,
  interventions: string[],
): string {
  const normalized = interventions
    .map((i) => i.toLowerCase().trim())
    .filter(Boolean)
    .sort();
  return `${pilgrimId}:${normalized.join("|")}`;
}
