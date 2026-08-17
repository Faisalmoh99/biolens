export interface SpeakerNote {
  title: string;
  bullets: string[];
}

export const SPEAKER_NOTES: Record<string, SpeakerNote> = {
  "/": {
    title: "Opening",
    bullets: [
      "147,000 medical services per Hajj season",
      "180 countries, often unconscious patients",
      "Medics can't identify them, don't know allergies",
      "BioLens solves this in <3 seconds",
    ],
  },
  "/home": {
    title: "Home",
    bullets: [
      "Two entry points: individual scan or mass-casualty triage",
      "Real-time, multi-language by default",
    ],
  },
  "/scan": {
    title: "Iris Scan",
    bullets: [
      "MediaPipe runs on-device (no server)",
      "TF.js MobileNet extracts iris embeddings",
      "Cosine similarity matches against enrolled database",
      "Demo mode uses pre-enrolled iris of selected pilgrim",
    ],
  },
  "/patient/pilgrim_001": {
    title: "Patient Profile (Budi)",
    bullets: [
      "TOP 3 FACTS are AI-filtered, not lookup",
      "Gemini surfaces penicillin allergy first — anaphylaxis risk",
      "Real-time translation to any language",
      "Voice reads facts aloud — try it now",
    ],
  },
  "/patient/pilgrim_002": {
    title: "Patient Profile (Aisha)",
    bullets: [
      "Sickle cell trait — heat-stroke amplifier",
      "Allergic to sulfa drugs — flag before antibiotics",
      "TOP 3 sorts allergies above chronic conditions",
    ],
  },
  "/patient/pilgrim_003": {
    title: "Patient Profile (Ibrahim)",
    bullets: [
      "Atrial fibrillation on warfarin — bleeding risk",
      "Avoid aspirin and NSAIDs",
      "Stroke watch: check for new neuro deficits",
    ],
  },
  "/patient/pilgrim_004": {
    title: "Patient Profile (Fatima)",
    bullets: [
      "Severe asthma — keep airway open",
      "Albuterol on Top 3 — first-line intervention",
      "Note prior ICU admission — escalate quickly",
    ],
  },
  "/patient/pilgrim_005": {
    title: "Patient Profile (Yusuf)",
    bullets: [
      "Insulin-dependent diabetic — hypoglycemia risk",
      "Glucose first, IV access second",
      "Translation feature shines for Indonesian speakers",
    ],
  },
  "/triage": {
    title: "Mass Triage",
    bullets: [
      "START Protocol applied first (deterministic rules) — two colors: RED or GREEN",
      'Gemini adds context layer — see "adjusted from START" badges',
      "3 RED (Budi, Fatima, Ayşe) and 2 GREEN (Aisha, Mahmoud) — critical vs non-critical",
      "Each card has 3 AI-generated immediate actions",
    ],
  },
};

export function getSpeakerNoteForRoute(pathname: string): SpeakerNote | null {
  if (SPEAKER_NOTES[pathname]) return SPEAKER_NOTES[pathname];
  // Fall back to a generic patient note for unmatched /patient/:id routes
  if (pathname.startsWith("/patient/")) {
    return {
      title: "Patient Profile",
      bullets: [
        "TOP 3 FACTS are AI-filtered for life-saving relevance",
        "Translate panel switches the whole profile to another language",
        "SOAP note generates a clinical handoff in seconds",
      ],
    };
  }
  return null;
}
