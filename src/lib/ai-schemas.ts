import { SchemaType, type ResponseSchema } from "@google/generative-ai";

export const lifeSavingFactsSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    facts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          icon: {
            type: SchemaType.STRING,
            format: "enum",
            enum: [
              "alert",
              "pill",
              "allergy",
              "surgery",
              "condition",
              "heart",
              "lung",
              "brain",
            ],
          },
          title: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
          criticality: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["high", "medium", "low"],
          },
          actionRecommended: { type: SchemaType.STRING },
        },
        required: [
          "id",
          "icon",
          "title",
          "content",
          "criticality",
          "actionRecommended",
        ],
      },
    },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["facts", "reasoning"],
};

export const triageContextSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    finalColor: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["red", "green"],
    },
    startProtocolColor: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["red", "green"],
    },
    confidence: { type: SchemaType.NUMBER },
    reasoning: { type: SchemaType.STRING },
    immediateActions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    adjustedFromStart: { type: SchemaType.BOOLEAN },
  },
  required: [
    "finalColor",
    "startProtocolColor",
    "confidence",
    "reasoning",
    "immediateActions",
    "adjustedFromStart",
  ],
};

export const translationSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    translatedText: { type: SchemaType.STRING },
    sourceLanguage: { type: SchemaType.STRING },
    targetLanguage: { type: SchemaType.STRING },
  },
  required: ["translatedText", "sourceLanguage", "targetLanguage"],
};

export const interactionAnalysisSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    alerts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          severity: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["contraindicated", "major", "moderate", "minor"],
          },
          drug1: { type: SchemaType.STRING },
          drug2: { type: SchemaType.STRING },
          mechanism: { type: SchemaType.STRING },
          clinicalEffect: { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING },
          sourceLabel: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["openFDA", "AI-knowledge"],
          },
        },
        required: [
          "severity",
          "drug1",
          "drug2",
          "mechanism",
          "clinicalEffect",
          "recommendation",
          "sourceLabel",
        ],
      },
    },
    drugsAnalyzed: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    drugsNotFoundInFDA: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["alerts", "drugsAnalyzed", "drugsNotFoundInFDA", "reasoning"],
};

export const soapNoteSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    subjective: { type: SchemaType.STRING },
    objective: { type: SchemaType.STRING },
    assessment: { type: SchemaType.STRING },
    plan: { type: SchemaType.STRING },
    generatedAt: { type: SchemaType.STRING },
  },
  required: ["subjective", "objective", "assessment", "plan", "generatedAt"],
};

export const recommendedInterventionsSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    interventions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          generic: { type: SchemaType.STRING },
          dose: { type: SchemaType.STRING },
          route: {
            type: SchemaType.STRING,
            enum: ["PO", "IV", "SL", "IN", "IM", "SC", "PR", "INH", "NEB"],
            format: "enum",
          },
          rationale: { type: SchemaType.STRING },
          urgency: {
            type: SchemaType.STRING,
            enum: ["immediate", "within-5-min", "monitor-first"],
            format: "enum",
          },
        },
        required: ["generic", "dose", "route", "rationale", "urgency"],
      },
    },
    reasoning: { type: SchemaType.STRING },
  },
  required: ["interventions", "reasoning"],
};

export const handoffSummarySchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    oneLiner: { type: SchemaType.STRING },
    vitals: { type: SchemaType.STRING },
    allergies: { type: SchemaType.STRING },
    currentMeds: { type: SchemaType.STRING },
    criticalNotes: { type: SchemaType.STRING },
  },
  required: ["oneLiner", "vitals", "allergies", "currentMeds", "criticalNotes"],
};
