import { generateStructured } from "./gemini";
import { interactionAnalysisSchema } from "./ai-schemas";
import { fetchMultipleDrugs } from "./openfda";
import type {
  InteractionAnalysis,
  RecommendedIntervention,
} from "@/types/ai";
import { DEMO_ONLY, DemoModeError } from "./demo";

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
  if (DEMO_ONLY) throw new DemoModeError();
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

const DRUG_NAME_REGEX =
  /\b(Atropine|Epinephrine|Adrenaline|Amiodarone|Vasopressin|Lidocaine|Heparin|Morphine|Furosemide|Naloxone|Adenosine|Magnesium|Calcium\s+gluconate|Aspirin|Nitroglycerin|Nitro|Albuterol|Dextrose|D50W|Oxygen)\b/gi;

/** Drug names mentioned in triage immediate actions (normalized, deduped). */
export function extractInterventionsFromActions(actions: string[]): string[] {
  const found = new Set<string>();
  for (const action of actions ?? []) {
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

/** Suggestions that aren't pharmacologic agents — irrelevant to an interaction check. */
const NON_DRUG = new Set(["water", "oral rehydration solution"]);

/**
 * Default proposed interventions for the interaction check: drugs named in
 * the triage actions, or — when triage names none — the recommended
 * suggestion generics (minus non-drugs). Shared by the precache builder and
 * the demo-mode dialog so cache keys always match.
 */
export function defaultProposedInterventions(
  actions: string[],
  suggestions: RecommendedIntervention[] | undefined,
): string[] {
  const fromTriage = extractInterventionsFromActions(actions);
  if (fromTriage.length > 0) return fromTriage;
  return (suggestions ?? [])
    .map((s) => s.generic.trim())
    .filter((g) => g && !NON_DRUG.has(g.toLowerCase()));
}
