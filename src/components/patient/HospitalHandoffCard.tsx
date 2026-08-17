import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Hospital as HospitalIcon, BedDouble, Send, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchHospitals, rankHospitalsForPatient } from "@/lib/hospitals";
import { useAppStore } from "@/store/appStore";
import { HospitalHandoffDialog } from "./HospitalHandoffDialog";
import type { Patient } from "@/types/patient";
import type { Hospital, RankedHospital } from "@/types/hospital";

interface HospitalHandoffCardProps {
  patient: Patient;
  openOnMount?: boolean;
}

function formatTimeHHMM(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function HospitalHandoffCard({
  patient,
  openOnMount,
}: HospitalHandoffCardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const handoffLog = useAppStore((s) => s.handoffLog);

  const [hospitals, setHospitals] = useState<Hospital[] | null>(null);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHospitals()
      .then((h) => {
        if (cancelled) return;
        setHospitals(h);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[Handoff] fetchHospitals failed", err);
        setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked: RankedHospital[] = useMemo(() => {
    if (!hospitals) return [];
    return rankHospitalsForPatient(patient, hospitals);
  }, [patient, hospitals]);

  useEffect(() => {
    if (!openOnMount || hasAutoOpened) return;
    if (!hospitals || ranked.length === 0) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setDialogOpen(true);
    setHasAutoOpened(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [openOnMount, hasAutoOpened, hospitals, ranked.length]);

  if (patient.demoSeverity !== "red") return null;

  const sentEntry = handoffLog[patient.id];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-triage-red/40 bg-gradient-to-br from-medical-surface/90 to-medical-deep/90 p-5 sm:p-6",
        "shadow-[0_0_30px_rgba(239,68,68,0.18)] backdrop-blur-sm",
      )}
    >
      <header className="mb-4 flex items-center gap-2">
        <HospitalIcon className="h-4 w-4 text-triage-red" aria-hidden />
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-triage-red sm:text-sm">
          {t("handoff.titleCritical")}
        </h2>
      </header>

      {error && (
        <p className="text-sm text-muted-foreground">
          {t("handoff.unavailable")}
        </p>
      )}

      {!error && ranked.length > 0 && (
        <>
          <TopHospital ranked={ranked[0]} lang={lang} />

          {sentEntry ? (
            <div className="mt-4 space-y-1">
              <div className="inline-flex items-center gap-2 rounded-md border border-triage-green/40 bg-triage-green/10 px-3 py-2 text-sm font-medium text-triage-green">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                <span>{t("handoff.sent")}</span>
                <span className="text-foreground/80">·</span>
                <span className="tabular-nums">
                  {formatTimeHHMM(sentEntry.sentAt)}
                </span>
                <span className="text-foreground/80">·</span>
                <span>{sentEntry.hospitalName}</span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="text-xs text-medical-glow/80 underline-offset-4 hover:text-medical-glow hover:underline"
                >
                  {t("handoff.resend")}
                </button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-4 bg-triage-red text-white hover:bg-triage-red/90"
            >
              <Send className="h-4 w-4" />
              {t("handoff.cta")}
            </Button>
          )}
        </>
      )}

      {!error && hospitals && ranked.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {t("handoff.unavailable")}
        </p>
      )}

      {hospitals && ranked.length > 0 && (
        <HospitalHandoffDialog
          patient={patient}
          ranked={ranked}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </section>
  );
}

function TopHospital({
  ranked,
  lang,
}: {
  ranked: RankedHospital;
  lang: "ar" | "en";
}) {
  const { t } = useTranslation();
  const { hospital, distanceKm, etaMin, matchedSpecialties } = ranked;
  return (
    <div className="rounded-xl border border-medical-cyan/20 bg-medical-deep/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-medium text-foreground">
          {hospital.shortName[lang]}
        </h3>
        <div className="text-xs tabular-nums text-foreground/60">
          {t("handoff.distanceKm", { km: distanceKm.toFixed(1) })} ·{" "}
          {t("handoff.etaMin", { min: etaMin })}
        </div>
      </div>

      {matchedSpecialties.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matchedSpecialties.map((s) => (
            <span
              key={s}
              className="rounded-full border border-medical-cyan/40 bg-medical-cyan/10 px-2 py-0.5 text-[11px] font-medium text-medical-glow"
            >
              {t(`handoff.specialty.${s}`)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-xs text-foreground/70">
        <BedDouble className="h-3.5 w-3.5" aria-hidden />
        {t("handoff.beds", { count: hospital.bedsAvailable })}
      </div>
    </div>
  );
}
