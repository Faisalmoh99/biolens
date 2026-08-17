import { useEffect, useState } from "react";

export const LOADING_MESSAGES = {
  ai: ["Analyzing context…", "Cross-referencing medical history…", "Prioritizing critical facts…"],
  triage: ["Applying START protocol…", "Evaluating clinical context…", "Generating action plan…"],
  soap: ["Drafting subjective…", "Compiling objective…", "Formulating assessment…", "Generating plan…"],
  match: ["Capturing iris pattern…", "Extracting biometric features…", "Matching against database…"],
  handoff: [
    "Compiling vitals…",
    "Cross-referencing allergies…",
    "Drafting handoff transmission…",
    "Finalizing pre-alert…",
  ],
  suggestions: [
    "Reviewing patient history…",
    "Considering current medications…",
    "Checking allergy contraindications…",
    "Ranking by urgency…",
  ],
} as const;

export type LoadingKey = keyof typeof LOADING_MESSAGES;

export function useCyclingMessage(messages: readonly string[], intervalMs = 1500) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % messages.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [messages, intervalMs]);
  return messages[idx];
}
