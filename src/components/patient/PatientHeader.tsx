import { useTranslation } from "react-i18next";

import { TriageBadge } from "@/components/ui/triage-badge";
import { PilgrimAvatar } from "@/components/patient/PilgrimAvatar";
import { cn } from "@/lib/utils";
import type { Patient, TriageColor } from "@/types/patient";

const TRIAGE_LABEL_KEY: Record<TriageColor, string> = {
  red: "triage.critical",
  green: "triage.stable",
};

const FLAG_BY_NATIONALITY: Record<string, string> = {
  Indonesia: "🇮🇩",
  "Türkiye": "🇹🇷",
  Turkey: "🇹🇷",
  Egypt: "🇪🇬",
  Pakistan: "🇵🇰",
  Nigeria: "🇳🇬",
  India: "🇮🇳",
  Bangladesh: "🇧🇩",
  Malaysia: "🇲🇾",
};

export function PatientHeader({ patient }: { patient: Patient }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const flag = FLAG_BY_NATIONALITY[patient.nationality.en] ?? "🌍";

  return (
    <div className="flex flex-col items-start gap-5 rounded-xl border border-medical-cyan/20 bg-medical-surface/60 p-5 backdrop-blur-sm sm:flex-row sm:items-center">
      <div className="rounded-full ring-2 ring-medical-cyan/40 ring-offset-2 ring-offset-medical-deep">
        <PilgrimAvatar patient={patient} size={96} animate />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1
            className={cn(
              "text-2xl font-bold tracking-tight text-medical-glow sm:text-3xl",
              isAr && "font-arabic",
            )}
          >
            {isAr ? patient.fullName.ar : patient.fullName.en}
          </h1>
          <span
            className={cn(
              "text-base text-foreground/70",
              !isAr && "font-arabic",
            )}
            dir={isAr ? "ltr" : "rtl"}
          >
            {isAr ? patient.fullName.en : patient.fullName.ar}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/80">
          <span className="text-base">{flag}</span>
          <span>{isAr ? patient.nationality.ar : patient.nationality.en}</span>
          <span className="text-foreground/30">•</span>
          <span>
            {patient.age} / {patient.sex === "male" ? "M" : "F"}
          </span>
          <span className="text-foreground/30">•</span>
          <span>Blood {patient.bloodType}</span>
          <span className="text-foreground/30">•</span>
          <span className="uppercase tracking-wide">
            {patient.primaryLanguage}
          </span>
        </div>

        <div className="pt-1">
          <TriageBadge
            color={patient.demoSeverity}
            label={t(TRIAGE_LABEL_KEY[patient.demoSeverity])}
            className="px-4 py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
