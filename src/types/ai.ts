export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";

export type FactIcon =
  | "alert"
  | "pill"
  | "allergy"
  | "surgery"
  | "condition"
  | "heart"
  | "lung"
  | "brain";
export type Criticality = "high" | "medium" | "low";

export interface LifeSavingFact {
  id: string;
  icon: FactIcon;
  title: string;
  content: string;
  criticality: Criticality;
  actionRecommended: string;
}

export interface LifeSavingFactsResponse {
  facts: LifeSavingFact[];
  reasoning: string;
}

export type TriageColor = "red" | "green";

export interface TriageContextDecision {
  finalColor: TriageColor;
  startProtocolColor: TriageColor;
  confidence: number;
  reasoning: string;
  immediateActions: string[];
  adjustedFromStart: boolean;
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  generatedAt: string;
}

export interface GeminiError {
  code: "auth" | "rate_limit" | "invalid_response" | "network" | "unknown";
  message: string;
  retryable: boolean;
}

export type InteractionSeverity =
  | "contraindicated"
  | "major"
  | "moderate"
  | "minor";

export interface InteractionAlert {
  severity: InteractionSeverity;
  drug1: string;
  drug2: string;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  sourceLabel: "openFDA" | "AI-knowledge";
}

export interface InteractionAnalysis {
  alerts: InteractionAlert[];
  drugsAnalyzed: string[];
  drugsNotFoundInFDA: string[];
  reasoning: string;
}

export interface HandoffSummary {
  oneLiner: string;
  vitals: string;
  allergies: string;
  currentMeds: string;
  criticalNotes: string;
  etaMin: number;
}

export type DrugRoute = 'PO' | 'IV' | 'SL' | 'IN' | 'IM' | 'SC' | 'PR' | 'INH' | 'NEB';
export type InterventionUrgency = 'immediate' | 'within-5-min' | 'monitor-first';

export interface RecommendedIntervention {
  generic: string;
  dose: string;
  route: DrugRoute;
  rationale: string;
  urgency: InterventionUrgency;
}

export interface RecommendedInterventionsResponse {
  interventions: RecommendedIntervention[];
  reasoning: string;
}
