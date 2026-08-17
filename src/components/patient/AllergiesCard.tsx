import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/patient/SectionCard";
import type { Allergy, Patient } from "@/types/patient";

const SEVERITY_STYLE: Record<
  Allergy["severity"],
  { wrap: string; icon: string }
> = {
  "life-threatening": {
    wrap: "border-triage-red/60 bg-triage-red/15 animate-pulse-glow shadow-[0_0_20px_rgba(239,68,68,0.45)]",
    icon: "text-triage-red",
  },
  severe: {
    wrap: "border-triage-orange/50 bg-triage-orange/10",
    icon: "text-triage-orange",
  },
  moderate: {
    wrap: "border-yellow-500/40 bg-yellow-500/10",
    icon: "text-yellow-300",
  },
  mild: {
    wrap: "border-white/10 bg-medical-deep/40",
    icon: "text-foreground/60",
  },
};

export function AllergiesCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t("profile.section.allergies")}
      icon={<ShieldAlert className="h-4 w-4" />}
    >
      {patient.allergies.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-triage-green/30 bg-triage-green/10 p-3 text-sm font-medium text-triage-green/90">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {t("profile.nkda")}
        </div>
      ) : (
        <ul className="space-y-2">
          {patient.allergies.map((a, i) => {
            const style = SEVERITY_STYLE[a.severity];
            const isLifeThreatening = a.severity === "life-threatening";
            return (
              <li
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-lg border p-3 text-sm",
                  style.wrap,
                )}
              >
                {isLifeThreatening && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.3) 50%, transparent 100%)",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{
                      duration: 3,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  />
                )}
                <div className="relative flex items-start gap-2">
                  <AlertTriangle
                    className={cn("mt-0.5 h-4 w-4 flex-shrink-0", style.icon)}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">
                      {a.substance}
                    </div>
                    <div className="text-xs text-foreground/70">
                      {a.reaction}
                    </div>
                    <div
                      className={cn(
                        "mt-1 inline-block rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wider",
                        style.icon,
                      )}
                    >
                      {a.severity}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
