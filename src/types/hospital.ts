export type HospitalSpecialty =
  | "cardiac"
  | "trauma"
  | "neuro"
  | "respiratory"
  | "obstetrics"
  | "emergency"
  | "heat-injury"
  | "general";

export interface Hospital {
  id: string;
  name: { ar: string; en: string };
  shortName: { ar: string; en: string };
  specialties: HospitalSpecialty[];
  location: { lat: number; lng: number };
  bedsAvailable: number;
  edStatus: "open" | "limited" | "diversion";
  phone: string;
  verifiedPartner: boolean;
}

export interface RankedHospital {
  hospital: Hospital;
  score: number;
  distanceKm: number;
  etaMin: number;
  matchedSpecialties: HospitalSpecialty[];
  reason: string;
}
