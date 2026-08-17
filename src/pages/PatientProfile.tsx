import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, Clock } from "lucide-react";

import { PageTransition } from "@/components/layout/PageTransition";
import { BioSkeleton } from "@/components/ui/bio-skeleton";
import { PatientHeader } from "@/components/patient/PatientHeader";
import { TopThreeFacts } from "@/components/patient/TopThreeFacts";
import { HospitalHandoffCard } from "@/components/patient/HospitalHandoffCard";
import { VitalsCard } from "@/components/patient/VitalsCard";
import { AllergiesCard } from "@/components/patient/AllergiesCard";
import { MedicationsCard } from "@/components/patient/MedicationsCard";
import { ConditionsCard } from "@/components/patient/ConditionsCard";
import { SurgeriesCard } from "@/components/patient/SurgeriesCard";
import { EmergencyContactsCard } from "@/components/patient/EmergencyContactsCard";
import { ProfileActions } from "@/components/patient/ProfileActions";

import { fetchPatient } from "@/lib/patients";
import { fetchTopFacts } from "@/lib/ai-filtering";
import { useAppStore } from "@/store/appStore";
import type { Patient } from "@/types/patient";
import type { LifeSavingFactsResponse } from "@/types/ai";
import type { LangCode } from "@/lib/translation";

export default function PatientProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const openHandoffParam = searchParams.get("openHandoff") === "1";
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const topFactsCache = useAppStore((s) => s.topFactsCache);
  const setTopFacts = useAppStore((s) => s.setTopFacts);
  const setCurrentPatientId = useAppStore((s) => s.setCurrentPatientId);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [facts, setFacts] = useState<LifeSavingFactsResponse | null>(null);
  const [factsLoading, setFactsLoading] = useState(false);
  const [factsError, setFactsError] = useState(false);
  const [displayedFacts, setDisplayedFacts] =
    useState<LifeSavingFactsResponse | null>(null);
  const [displayedFactsLang, setDisplayedFactsLang] = useState<LangCode>(
    language === "ar" ? "ar" : "en",
  );
  const arrivedAt = useMemo(() => Date.now(), [id]);

  // Top 3 facts are generated in English (see ai-prompts.ts).
  const originalLang: LangCode = "en";

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setPatient(null);
    setPatientError(null);
    setCurrentPatientId(id);
    fetchPatient(id)
      .then((p) => {
        if (cancelled) return;
        setPatient(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPatientError(
          err instanceof Error ? err.message : "Failed to load patient",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id, setCurrentPatientId]);

  useEffect(() => {
    if (!patient || !id) return;
    const cached = topFactsCache[id];
    if (cached) {
      setFacts(cached);
      setDisplayedFacts(cached);
      setDisplayedFactsLang(originalLang);
      setFactsLoading(false);
      setFactsError(false);
      return;
    }
    let cancelled = false;
    setFacts(null);
    setDisplayedFacts(null);
    setFactsError(false);
    setFactsLoading(true);
    fetchTopFacts(patient)
      .then((res) => {
        if (cancelled) return;
        setFacts(res);
        setDisplayedFacts(res);
        setDisplayedFactsLang(originalLang);
        setTopFacts(id, res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[PatientProfile] fetchTopFacts failed", err);
        setFactsError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setFactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient, id, topFactsCache, setTopFacts]);

  const handleTranslated = useCallback(
    (translated: LifeSavingFactsResponse, lang: LangCode) => {
      setDisplayedFacts(translated);
      setDisplayedFactsLang(lang);
    },
    [],
  );

  return (
    <PageTransition>
      <div className="container mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        <TopBar
          patientId={id ?? ""}
          arrivedAt={arrivedAt}
          backLabel={t("profile.back")}
          lastSeenLabel={t("profile.lastSeen")}
        />

        {!patient && !patientError && <ProfileSkeleton />}

        {patientError && (
          <div className="rounded-xl border border-triage-red/40 bg-triage-red/10 p-6 text-sm text-triage-red">
            {patientError}
          </div>
        )}

        {patient && (
          <div className="space-y-6">
            <SectionReveal order={0}>
              <PatientHeader patient={patient} />
            </SectionReveal>

            <SectionReveal order={1}>
              <TopThreeFacts
                patient={patient}
                facts={displayedFacts}
                loading={factsLoading}
                error={factsError}
              />
            </SectionReveal>

            <SectionReveal order={2}>
              <HospitalHandoffCard
                patient={patient}
                openOnMount={openHandoffParam}
              />
            </SectionReveal>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionReveal order={3}>
                <VitalsCard patient={patient} />
              </SectionReveal>
              <SectionReveal order={4}>
                <AllergiesCard patient={patient} />
              </SectionReveal>
            </div>

            <SectionReveal order={5}>
              <MedicationsCard patient={patient} />
            </SectionReveal>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionReveal order={6}>
                <ConditionsCard patient={patient} />
              </SectionReveal>
              <SectionReveal order={7}>
                <SurgeriesCard patient={patient} />
              </SectionReveal>
            </div>

            <SectionReveal order={8}>
              <EmergencyContactsCard patient={patient} />
            </SectionReveal>

            <SectionReveal order={9}>
              <ProfileActions
                patient={patient}
                originalFacts={facts}
                displayedFacts={displayedFacts}
                originalLang={originalLang}
                displayedLang={displayedFactsLang}
                onTranslated={handleTranslated}
              />
            </SectionReveal>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function TopBar({
  patientId,
  arrivedAt,
  backLabel,
  lastSeenLabel,
}: {
  patientId: string;
  arrivedAt: number;
  backLabel: string;
  lastSeenLabel: string;
}) {
  const arrived = new Date(arrivedAt);
  const hh = arrived.getHours().toString().padStart(2, "0");
  const mm = arrived.getMinutes().toString().padStart(2, "0");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <Link
        to="/scan"
        className="inline-flex items-center gap-2 rounded-md border border-medical-cyan/30 bg-medical-surface/60 px-3 py-1.5 text-medical-glow hover:bg-medical-cyan/10"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
      <div className="flex items-center gap-3 text-xs text-foreground/60">
        <span className="font-mono uppercase tracking-wider text-medical-glow/80">
          {patientId}
        </span>
        <span className="text-foreground/30">|</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {lastSeenLabel} {hh}:{mm}
        </span>
      </div>
    </div>
  );
}

function SectionReveal({
  children,
  order,
}: {
  children: React.ReactNode;
  order: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: order * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <BioSkeleton className="h-32 w-full" />
      <BioSkeleton className="h-64 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <BioSkeleton className="h-44 w-full" />
        <BioSkeleton className="h-44 w-full" />
      </div>
    </div>
  );
}
