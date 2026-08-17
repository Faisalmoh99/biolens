import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/patient/SectionCard";
import type { ChronicCondition, Patient } from "@/types/patient";

const SEV_BADGE: Record<ChronicCondition["severity"], string> = {
  severe: "border-triage-red/50 bg-triage-red/10 text-triage-red",
  moderate: "border-triage-orange/40 bg-triage-orange/10 text-triage-orange",
  mild: "border-triage-green/40 bg-triage-green/10 text-triage-green",
};

export function ConditionsCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t("profile.section.conditions")}
      icon={<Activity className="h-4 w-4" />}
    >
      <ul className="space-y-2 text-sm">
        {patient.chronicConditions.map((c, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-medical-deep/40 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium text-foreground">{c.name}</div>
              <div className="text-[11px] text-foreground/55">
                {c.icd10} • {c.diagnosedYear}
              </div>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider",
                SEV_BADGE[c.severity],
              )}
            >
              {c.severity}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
