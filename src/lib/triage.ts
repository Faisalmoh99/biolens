import type { Patient, TriageColor } from "@/types/patient";

export interface TriageResult {
  color: TriageColor;
  rulesFired: string[];
}

export function startProtocol(patient: Patient): TriageResult {
  const v = patient.demoVitals;
  const rulesFired: string[] = [];

  // GREEN: ambulatory + alert + vitals within safe ranges
  if (
    v.canWalk &&
    v.consciousness === "alert" &&
    v.heartRate >= 50 && v.heartRate <= 110 &&
    v.respRate >= 10 && v.respRate <= 30 &&
    v.spo2 >= 92 &&
    v.systolicBP >= 90
  ) {
    return { color: "green", rulesFired: ["ambulatory + alert + stable vitals"] };
  }

  // Otherwise RED — record every rule that contributed
  if (!v.canWalk) rulesFired.push("cannot walk");
  if (v.consciousness !== "alert") rulesFired.push(`AVPU: ${v.consciousness}`);
  if (v.respRate === 0) rulesFired.push("apnea");
  else if (v.respRate > 30) rulesFired.push(`RR ${v.respRate} > 30`);
  else if (v.respRate < 10) rulesFired.push(`RR ${v.respRate} < 10`);
  if (v.spo2 < 92) rulesFired.push(`SpO2 ${v.spo2}% < 92`);
  if (v.systolicBP < 90) rulesFired.push(`SBP ${v.systolicBP} < 90`);
  if (v.heartRate < 50) rulesFired.push(`HR ${v.heartRate} < 50`);
  else if (v.heartRate > 110) rulesFired.push(`HR ${v.heartRate} > 110`);

  return { color: "red", rulesFired };
}
