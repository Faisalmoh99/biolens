import { useTranslation } from "react-i18next";
import { Scissors } from "lucide-react";

import { SectionCard } from "@/components/patient/SectionCard";
import type { Patient } from "@/types/patient";

export function SurgeriesCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();

  if (patient.surgeries.length === 0) return null;

  return (
    <SectionCard
      title={t("profile.section.surgeries")}
      icon={<Scissors className="h-4 w-4" />}
    >
      <ul className="space-y-2 text-sm">
        {patient.surgeries.map((s, i) => (
          <li
            key={i}
            className="rounded-md border border-white/5 bg-medical-deep/40 px-3 py-2"
          >
            <div className="font-medium text-foreground">{s.procedure}</div>
            <div className="text-[11px] text-foreground/55">
              {s.date} • {s.hospital}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
