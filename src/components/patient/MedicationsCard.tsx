import { useTranslation } from "react-i18next";
import { Pill } from "lucide-react";

import { SectionCard } from "@/components/patient/SectionCard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Patient } from "@/types/patient";

export function MedicationsCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t("profile.section.medications")}
      icon={<Pill className="h-4 w-4" />}
    >
      <TooltipProvider delayDuration={150}>
        <ul className="space-y-1.5 text-sm">
          {patient.medications.map((m, i) => (
            <li key={i} className="rounded-md px-2 py-1.5 hover:bg-medical-cyan/5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-wrap items-baseline gap-x-2 text-foreground/90">
                    <span className="font-semibold text-foreground">
                      {m.generic}
                    </span>
                    <span className="text-xs text-foreground/60">
                      ({m.brand})
                    </span>
                    <span className="text-foreground/80">{m.dose}</span>
                    <span className="text-xs text-foreground/60">
                      {m.frequency}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{m.indication}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </SectionCard>
  );
}
