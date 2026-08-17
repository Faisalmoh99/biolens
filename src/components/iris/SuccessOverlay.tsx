import { useEffect } from "react";
import { motion } from "framer-motion";

import { ConfidenceCounter } from "./ConfidenceCounter";
import { PilgrimAvatar } from "@/components/patient/PilgrimAvatar";
import { countryCodeToFlag, nationalityToCode } from "@/lib/utils";
import type { Patient, TriageColor } from "@/types/patient";

interface SuccessOverlayProps {
  patient: Patient;
  similarity: number;
  onComplete: () => void;
}

const TRIAGE_BAND: Record<TriageColor, string> = {
  red: "bg-triage-red",
  green: "bg-triage-green",
};

export function SuccessOverlay({
  patient,
  similarity,
  onComplete,
}: SuccessOverlayProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1500);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const flagCode = nationalityToCode(patient.nationality.en);
  const flag = countryCodeToFlag(flagCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-medical-deep/70 backdrop-blur-sm">
      {/* Cyan radial flash */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.85) 0%, rgba(34,211,238,0) 65%)",
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.45,
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative w-[min(420px,90vw)] overflow-hidden rounded-2xl border border-medical-cyan/50 bg-medical-deep/95 shadow-[0_0_80px_rgba(34,211,238,0.6)]"
      >
        {/* Triage color band */}
        <div className={`h-1.5 w-full ${TRIAGE_BAND[patient.demoSeverity]}`} />

        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3, ease: "easeOut" }}
            className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-2 border-medical-cyan shadow-[0_0_30px_rgba(34,211,238,0.7)]"
          >
            <PilgrimAvatar patient={patient} size={120} animate />
          </motion.div>

          <div className="flex flex-col gap-0.5">
            <div className="font-arabic text-xl font-semibold text-medical-glow">
              {patient.fullName.ar}
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {patient.fullName.en}
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-medical-cyan/80">
            <span>{patient.age}y</span>
            <span aria-hidden>·</span>
            <span>{patient.sex === "male" ? "M" : "F"}</span>
            <span aria-hidden>·</span>
            <span className="text-base leading-none">{flag}</span>
            <span>{patient.nationality.en}</span>
          </div>

          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              MATCH CONFIDENCE
            </div>
            <ConfidenceCounter
              target={similarity}
              className="font-mono text-4xl font-bold text-medical-glow"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
