import type { Hospital, HospitalSpecialty, RankedHospital } from "@/types/hospital";
import type { Patient } from "@/types/patient";

let hospitalsCache: Hospital[] | null = null;

export async function fetchHospitals(): Promise<Hospital[]> {
  if (hospitalsCache) return hospitalsCache;
  const res = await fetch("/data/hospitals.json");
  if (!res.ok) throw new Error("Failed to load hospitals");
  hospitalsCache = await res.json();
  return hospitalsCache!;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function rankHospitalsForPatient(
  patient: Patient,
  hospitals: Hospital[],
): RankedHospital[] {
  if (!patient.demoLocation) return [];
  const required = patient.requiredSpecialties ?? ["general"];
  const patientLoc = {
    lat: patient.demoLocation.lat,
    lng: patient.demoLocation.lng,
  };

  const ranked = hospitals.map<RankedHospital>((h) => {
    const distanceKm = haversineKm(patientLoc, h.location);
    const etaMin = Math.max(3, Math.round((distanceKm / 60) * 60 + 3));
    const matched = required.filter((r) =>
      h.specialties.includes(r as HospitalSpecialty),
    ) as HospitalSpecialty[];
    const specialtyScore = matched.length / required.length;
    const distanceScore = 1 / (1 + distanceKm / 5);
    const bedsScore = Math.min(h.bedsAvailable / 10, 1);
    const statusPenalty =
      h.edStatus === "diversion" ? 0.2 : h.edStatus === "limited" ? 0.7 : 1.0;
    const score =
      (distanceScore * 0.45 + specialtyScore * 0.4 + bedsScore * 0.15) *
      statusPenalty;
    const reason =
      matched.length > 0
        ? `Matches ${matched.join(", ")} · ${distanceKm.toFixed(1)} km · ETA ${etaMin} min`
        : `Closest available · ${distanceKm.toFixed(1)} km · ETA ${etaMin} min`;
    return {
      hospital: h,
      score,
      distanceKm,
      etaMin,
      matchedSpecialties: matched,
      reason,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}
