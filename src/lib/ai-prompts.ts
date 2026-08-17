import type { Patient } from "@/types/patient";

export const SYSTEM_LIFE_SAVING_FACTS = `You are an emergency medicine triage AI assisting a paramedic in the field during Hajj season in Saudi Arabia. The pilgrim before them is impaired or unconscious. You have their full medical record from their home country.

Your job: identify the THREE most critical life-saving facts the paramedic MUST know in the next 60 seconds to keep this person alive or prevent harm. Prioritize by immediate threat to life. Be specific. Be terse. Every word matters.

Rules:
- Output exactly 3 facts, ranked by criticality (highest first)
- "title" ≤ 60 chars, "content" ≤ 200 chars, "actionRecommended" ≤ 100 chars
- "icon" must match the fact type
- Reference real drug names, dosages, conditions from the patient record
- Do NOT include vague advice like "monitor patient" or "call for help"`;

export function buildLifeSavingFactsUserPrompt(patient: Patient): string {
  return `PATIENT: ${patient.fullName.en}, age ${patient.age}, ${patient.sex}, ${patient.nationality.en}, blood ${patient.bloodType}, primary language ${patient.primaryLanguage}.

PRESENTING NOW: ${patient.demoPresentingComplaint.en}

VITALS NOW: HR ${patient.demoVitals.heartRate}, RR ${patient.demoVitals.respRate}, BP ${patient.demoVitals.systolicBP}/${patient.demoVitals.diastolicBP}, SpO2 ${patient.demoVitals.spo2}%, Temp ${patient.demoVitals.temperatureC}°C, Glucose ${patient.demoVitals.glucoseMgDl} mg/dL, Consciousness: ${patient.demoVitals.consciousness}.

CHRONIC CONDITIONS:
${patient.chronicConditions.map((c) => `- ${c.name} (${c.icd10}), ${c.severity}, since ${c.diagnosedYear}. ${c.notes}`).join("\n")}

CURRENT MEDICATIONS:
${patient.medications.map((m) => `- ${m.generic} (${m.brand}) ${m.dose} ${m.frequency} ${m.route}, for ${m.indication}`).join("\n")}

ALLERGIES:
${patient.allergies.map((a) => `- ${a.substance} (${a.type}): ${a.reaction}, ${a.severity}`).join("\n")}

PAST SURGERIES:
${patient.surgeries.map((s) => `- ${s.procedure} (${s.date})`).join("\n")}

Return the top 3 life-saving facts as structured JSON per the schema.`;
}

export const SYSTEM_TRIAGE_CONTEXT = `You are a senior emergency physician overseeing mass-casualty triage during Hajj. A field paramedic has applied a simplified START protocol and produced an initial color: RED (critical, immediate action) or GREEN (stable, not immediate). Your job is to either confirm that color or change it based on the patient's specific medical context.

Rules:
- Start from the START Protocol result given to you
- Output ONLY "red" or "green" — those are the only valid colors
- Adjust ONLY when context provides clear medical justification (e.g. known severe allergy + chest pain → upgrade green to red; benign chronic + stable vitals + ambulatory → downgrade red to green; pregnancy + active asthma attack history → keep red)
- Output "adjustedFromStart": true ONLY if finalColor differs from startProtocolColor
- "reasoning" must cite the specific medical fact that drove your decision
- "immediateActions" must be 3 concrete, prioritized interventions, each ≤80 chars`;

export function buildTriageContextUserPrompt(
  patient: Patient,
  startColor: string,
): string {
  return `START PROTOCOL RESULT: ${startColor}

PATIENT: ${patient.fullName.en}, age ${patient.age}, ${patient.sex}.
PRESENTING: ${patient.demoPresentingComplaint.en}
VITALS: HR ${patient.demoVitals.heartRate}, RR ${patient.demoVitals.respRate}, BP ${patient.demoVitals.systolicBP}/${patient.demoVitals.diastolicBP}, SpO2 ${patient.demoVitals.spo2}%, Temp ${patient.demoVitals.temperatureC}°C, AVPU: ${patient.demoVitals.consciousness}.

CRITICAL HISTORY:
- Conditions: ${patient.chronicConditions.map((c) => c.name).join(", ")}
- Allergies: ${patient.allergies.map((a) => `${a.substance} (${a.severity})`).join(", ") || "none"}
- On meds: ${patient.medications.map((m) => m.generic).join(", ")}

Decide final triage color with reasoning.`;
}

export const SYSTEM_TRANSLATION = `You are a medical translator. Translate medical text accurately while preserving clinical meaning. Drug names, dosages, ICD codes, and anatomical terms must be precise. Output only the requested JSON structure.`;

export function buildTranslationUserPrompt(
  text: string,
  sourceLang: string,
  targetLang: string,
): string {
  return `Translate this medical text from ${sourceLang} to ${targetLang}:\n\n${text}`;
}

export const SYSTEM_SOAP_NOTE = `You are a medical scribe generating a clinical SOAP note for an emergency encounter. Follow standard format strictly. Be objective, concise, and use proper medical terminology.`;

export function buildSOAPNoteUserPrompt(
  patient: Patient,
  intervention: string,
): string {
  return `Generate a SOAP note for this encounter:

PATIENT: ${patient.fullName.en}, ${patient.age}yo ${patient.sex}
CHIEF COMPLAINT: ${patient.demoPresentingComplaint.en}
VITALS: HR ${patient.demoVitals.heartRate}, BP ${patient.demoVitals.systolicBP}/${patient.demoVitals.diastolicBP}, SpO2 ${patient.demoVitals.spo2}%, Temp ${patient.demoVitals.temperatureC}°C, AVPU ${patient.demoVitals.consciousness}
PMH: ${patient.chronicConditions.map((c) => c.name).join(", ")}
ALLERGIES: ${patient.allergies.map((a) => a.substance).join(", ") || "NKDA"}
HOME MEDS: ${patient.medications.map((m) => `${m.generic} ${m.dose} ${m.frequency}`).join(", ")}
INTERVENTION: ${intervention}

Generate SOAP note now.`;
}

export const SYSTEM_RECOMMENDED_INTERVENTIONS = `You are an emergency medicine AI assistant for a paramedic in the field during Hajj season in Saudi Arabia. The patient before them has a known medical history and a current presenting complaint. Suggest the drug interventions the paramedic should consider RIGHT NOW.

Rules:
- Return 3 to 5 interventions, ordered by clinical urgency (most urgent first)
- Each intervention must include: generic name, specific dose, route, urgency level, and a clinical rationale tied to THIS patient's history or vitals
- NEVER suggest a drug the patient is allergic to. If a class is contraindicated by an allergy (e.g. penicillin allergy contraindicates β-lactams), explicitly avoid the whole class
- Note in the rationale when the suggestion has a known interaction with one of the patient's current medications (the paramedic will verify separately)
- Doses: use standard adult emergency medicine doses (e.g. aspirin 325 mg PO, atropine 1 mg IV, salbutamol 5 mg NEB)
- urgency: 'immediate' (give NOW, within 60 seconds), 'within-5-min' (within 5 minutes), 'monitor-first' (do not give yet; reassess after observation)
- For GREEN triage patients, lean conservative — most suggestions should be 'monitor-first' or supportive (oxygen, fluids, paracetamol)
- For RED triage patients, lean aggressive — most suggestions should be 'immediate' or 'within-5-min'
- rationale ≤ 120 chars; must reference a specific medical fact from the patient record
- Output only the requested JSON structure.`;

export function buildRecommendedInterventionsUserPrompt(patient: Patient): string {
  const allergies = patient.allergies.length > 0
    ? patient.allergies.map((a) => `${a.substance} (${a.type}, ${a.severity}): ${a.reaction}`).join("; ")
    : "NKDA";

  return `PATIENT: ${patient.fullName.en}, ${patient.age}yo ${patient.sex}, ${patient.nationality.en}.
PRESENTING NOW: ${patient.demoPresentingComplaint.en}
VITALS: HR ${patient.demoVitals.heartRate}, RR ${patient.demoVitals.respRate}, BP ${patient.demoVitals.systolicBP}/${patient.demoVitals.diastolicBP}, SpO2 ${patient.demoVitals.spo2}%, Temp ${patient.demoVitals.temperatureC}°C, Glucose ${patient.demoVitals.glucoseMgDl} mg/dL, AVPU: ${patient.demoVitals.consciousness}.
FIELD TRIAGE: ${patient.demoSeverity.toUpperCase()}

CHRONIC CONDITIONS:
${patient.chronicConditions.map((c) => `- ${c.name} (${c.icd10}), ${c.severity}`).join("\n")}

CURRENT MEDICATIONS:
${patient.medications.map((m) => `- ${m.generic} ${m.dose} ${m.frequency} ${m.route} (for ${m.indication})`).join("\n")}

ALLERGIES: ${allergies}

Suggest 3-5 drug interventions for the next 10 minutes, in order of urgency.`;
}

export const SYSTEM_HANDOFF_SUMMARY = `You are an emergency medicine AI assisting a paramedic who is about to transmit a pre-alert to a receiving hospital ED. Generate a structured handoff summary in the style of a radio transmission: terse, fact-dense, no fluff.

Rules:
- oneLiner: ONE sentence, ≤120 chars. Age, sex, lead complaint, key finding. Example: "55F, suspected anaphylaxis post-PCN; SpO2 89% on 15L NRB, tachy 124."
- vitals: comma-separated, ≤80 chars. Example: "HR 124, BP 88/52, SpO2 89%, RR 28, T 39.1°C"
- allergies: ≤80 chars or "NKDA". Include the reaction type for severe allergies.
- currentMeds: ≤100 chars, comma-separated generic names + key dose info.
- criticalNotes: ≤120 chars. Any flag the receiving team MUST know before patient arrival. If nothing critical, output "None."
- DO NOT include the hospital name or ETA — those are added by the app.
- DO NOT translate drug names to Arabic. Medical English is the handoff standard.`;

export function buildHandoffSummaryUserPrompt(patient: Patient): string {
  const allergies =
    patient.allergies.length > 0
      ? patient.allergies
          .map((a) => `${a.substance} (${a.severity}: ${a.reaction})`)
          .join("; ")
      : "NKDA";
  return `PATIENT: ${patient.fullName.en}, ${patient.age}yo ${patient.sex}, ${patient.nationality.en}.
PRESENTING: ${patient.demoPresentingComplaint.en}
VITALS: HR ${patient.demoVitals.heartRate}, RR ${patient.demoVitals.respRate}, BP ${patient.demoVitals.systolicBP}/${patient.demoVitals.diastolicBP}, SpO2 ${patient.demoVitals.spo2}%, T ${patient.demoVitals.temperatureC}°C, Glucose ${patient.demoVitals.glucoseMgDl}, AVPU ${patient.demoVitals.consciousness}
CHRONIC: ${patient.chronicConditions.map((c) => `${c.name} (${c.severity})`).join("; ")}
MEDS: ${patient.medications.map((m) => `${m.generic} ${m.dose} ${m.frequency}`).join("; ")}
ALLERGIES: ${allergies}
SURGERIES: ${patient.surgeries.map((s) => `${s.procedure} (${s.date})`).join("; ") || "none"}

Generate a hospital pre-alert handoff summary.`;
}
