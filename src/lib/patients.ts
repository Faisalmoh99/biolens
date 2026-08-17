import type { Patient } from "@/types/patient";

export async function fetchPatient(id: string): Promise<Patient> {
  const res = await fetch(`/data/pilgrims/${id}.json`);
  if (!res.ok) throw new Error(`Patient ${id} not found`);
  return res.json();
}

export async function fetchAllPatients(): Promise<Patient[]> {
  const idx = await fetch("/data/pilgrims/_index.json").then((r) => r.json());
  return Promise.all(
    idx.pilgrims.map((p: { id: string }) => fetchPatient(p.id)),
  );
}
