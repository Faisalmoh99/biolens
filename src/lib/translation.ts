import { generateStructured, generateText } from "./gemini";
import { translationSchema } from "./ai-schemas";
import {
  SYSTEM_TRANSLATION,
  buildTranslationUserPrompt,
} from "./ai-prompts";
import type { TranslationResult, LifeSavingFactsResponse } from "@/types/ai";

export type LangCode = "ar" | "en";

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: LangCode,
): Promise<TranslationResult> {
  return generateStructured<TranslationResult>(
    SYSTEM_TRANSLATION,
    buildTranslationUserPrompt(text, sourceLang, targetLang),
    translationSchema,
    { model: "gemini-2.5-flash", temperature: 0.1 },
  );
}

export async function translateFacts(
  facts: LifeSavingFactsResponse,
  targetLang: LangCode,
): Promise<LifeSavingFactsResponse> {
  const payload = JSON.stringify(facts);
  const sys = `${SYSTEM_TRANSLATION}\n\nYou will receive a JSON object with medical facts. Translate ALL text fields (title, content, actionRecommended, reasoning) into the target language. Preserve the JSON structure, keys, and non-text values (id, icon, criticality) exactly. Output the translated JSON only.`;
  const userPrompt = `TARGET LANGUAGE: ${targetLang}\n\nJSON:\n${payload}`;
  const raw = await generateText(sys, userPrompt, { temperature: 0.1 });
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();
  return JSON.parse(cleaned) as LifeSavingFactsResponse;
}
