import { generateStructured } from "./gemini";
import { soapNoteSchema } from "./ai-schemas";
import { SYSTEM_SOAP_NOTE, buildSOAPNoteUserPrompt } from "./ai-prompts";
import type { Patient } from "@/types/patient";
import type { SOAPNote } from "@/types/ai";

export async function generateSOAPNote(
  patient: Patient,
  intervention: string,
): Promise<SOAPNote> {
  const result = await generateStructured<SOAPNote>(
    SYSTEM_SOAP_NOTE,
    buildSOAPNoteUserPrompt(patient, intervention),
    soapNoteSchema,
    { model: "gemini-2.5-pro", temperature: 0.2 },
  );
  return { ...result, generatedAt: new Date().toISOString() };
}
