import type { HospitalSpecialty } from "@/types/hospital";

export type TriageColor = "red" | "green";

export interface Medication {
  generic: string;
  brand: string;
  dose: string;
  frequency: string;
  route: string;
  startedYear: number;
  indication: string;
}

export interface ChronicCondition {
  name: string;
  icd10: string;
  diagnosedYear: number;
  severity: "mild" | "moderate" | "severe";
  notes: string;
}

export interface Allergy {
  substance: string;
  type: "drug" | "food" | "environmental";
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life-threatening";
}

export interface Surgery {
  procedure: string;
  date: string;
  hospital: string;
  notes?: string;
}

export interface Vaccination {
  name: string;
  date: string;
  lotNumber?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  language: string;
}

export interface ClinicalNote {
  date: string;
  author: string;
  content: string;
}

export interface Patient {
  id: string;
  hajjPermitNumber: string;
  fullName: { ar: string; en: string };
  age: number;
  sex: "male" | "female";
  nationality: { ar: string; en: string };
  primaryLanguage: string;
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  weightKg: number;
  heightCm: number;
  chronicConditions: ChronicCondition[];
  medications: Medication[];
  allergies: Allergy[];
  surgeries: Surgery[];
  vaccinations: Vaccination[];
  emergencyContacts: EmergencyContact[];
  companion?: {
    name: string;
    nameAr: string;
    relationship: { ar: string; en: string };
    phoneSA: string;
    languages: string[];
  } | null;
  clinicalNotes: ClinicalNote[];
  demoSeverity: TriageColor;
  demoPresentingComplaint: { ar: string; en: string };
  demoVitals: {
    heartRate: number;
    respRate: number;
    systolicBP: number;
    diastolicBP: number;
    spo2: number;
    temperatureC: number;
    glucoseMgDl: number;
    consciousness: "alert" | "verbal" | "pain" | "unresponsive";
    canWalk: boolean;
  };
  demoLocation?: {
    lat: number;
    lng: number;
    siteName: { ar: string; en: string };
  };
  requiredSpecialties?: HospitalSpecialty[];
}
