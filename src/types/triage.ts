export type TriageColor = "red" | "green";

export interface TriageResult {
  patientId: string;
  color: TriageColor;
  reason?: string;
  timestamp: number;
}
