import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, RefreshCw, Users } from "lucide-react";

import { PageTransition } from "@/components/layout/PageTransition";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { TriageStats } from "@/components/triage/TriageStats";
import { TriageStatsBar } from "@/components/triage/TriageStatsBar";
import { TriageCard } from "@/components/triage/TriageCard";

import { fetchAllPatients } from "@/lib/patients";
import { startProtocol, type TriageResult } from "@/lib/triage";
import { evaluateTriage } from "@/lib/ai-triage";
import { playSoftClick } from "@/lib/sounds";
import { useAppStore } from "@/store/appStore";
import type { Patient, TriageColor } from "@/types/patient";

const PRIORITY: Record<TriageColor, number> = {
  red: 0,
  green: 1,
};

interface CardState {
  loading: boolean;
  error: boolean;
}

export default function TriageGroup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const triageDecisions = useAppStore((s) => s.triageDecisions);
  const setTriageDecision = useAppStore((s) => s.setTriageDecision);
  const clearTriageDecisions = useAppStore((s) => s.clearTriageDecisions);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsError, setPatientsError] = useState<string | null>(null);
  const [cardState, setCardState] = useState<Record<string, CardState>>({});
  const [clock, setClock] = useState(() => new Date());
  const [refreshTick, setRefreshTick] = useState(0);

  // Live clock
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Load patients
  useEffect(() => {
    let cancelled = false;
    setPatientsError(null);
    fetchAllPatients()
      .then((all) => {
        if (cancelled) return;
        setPatients(all);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPatientsError(
          err instanceof Error ? err.message : "Failed to load patients",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-compute START results synchronously
  const startResults = useMemo(() => {
    const map: Record<string, TriageResult> = {};
    for (const p of patients) map[p.id] = startProtocol(p);
    return map;
  }, [patients]);

  // Fire AI evaluations in parallel
  useEffect(() => {
    if (patients.length === 0) return;
    let cancelled = false;

    const initial: Record<string, CardState> = {};
    for (const p of patients) {
      if (!triageDecisions[p.id]) {
        initial[p.id] = { loading: true, error: false };
      }
    }
    if (Object.keys(initial).length > 0) {
      setCardState((s) => ({ ...s, ...initial }));
    }

    const tasks = patients
      .filter((p) => !triageDecisions[p.id])
      .map((p) =>
        evaluateTriage(p)
          .then((decision) => {
            if (cancelled) return;
            setTriageDecision(p.id, decision);
            setCardState((s) => ({
              ...s,
              [p.id]: { loading: false, error: false },
            }));
          })
          .catch((err) => {
            if (cancelled) return;
            console.error("[TriageGroup] evaluateTriage failed", p.id, err);
            setCardState((s) => ({
              ...s,
              [p.id]: { loading: false, error: true },
            }));
          }),
      );

    Promise.all(tasks);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients, refreshTick]);

  const handleRefresh = useCallback(() => {
    playSoftClick();
    clearTriageDecisions();
    setCardState({});
    setRefreshTick((n) => n + 1);
  }, [clearTriageDecisions]);

  // Sort patients by final color (decision) or START fallback
  const sorted = useMemo(() => {
    return [...patients].sort((a, b) => {
      const ca = triageDecisions[a.id]?.finalColor ?? startResults[a.id]?.color ?? "green";
      const cb = triageDecisions[b.id]?.finalColor ?? startResults[b.id]?.color ?? "green";
      return PRIORITY[ca] - PRIORITY[cb];
    });
  }, [patients, triageDecisions, startResults]);

  const counts = useMemo<Record<TriageColor, number>>(() => {
    const acc: Record<TriageColor, number> = { red: 0, green: 0 };
    for (const p of patients) {
      const color =
        triageDecisions[p.id]?.finalColor ?? startResults[p.id]?.color ?? "green";
      acc[color] += 1;
    }
    return acc;
  }, [patients, triageDecisions, startResults]);

  const anyLoading = Object.values(cardState).some((s) => s?.loading);

  const hh = clock.getHours().toString().padStart(2, "0");
  const mm = clock.getMinutes().toString().padStart(2, "0");
  const ss = clock.getSeconds().toString().padStart(2, "0");

  return (
    <PageTransition>
      <div className="container mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-medical-cyan/30 bg-medical-surface/60 px-3 py-1.5 text-sm text-medical-glow hover:bg-medical-cyan/10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("triage.back")}
          </Link>

          <h1 className="order-3 w-full text-center text-2xl font-bold uppercase tracking-[0.32em] text-medical-glow sm:order-none sm:w-auto sm:text-xl">
            {t("triage.title")}
          </h1>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-md border border-triage-red/40 bg-triage-red/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-triage-red">
              <motion.span
                aria-hidden
                className="relative flex h-2 w-2"
                animate={{ scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-triage-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-triage-red" />
              </motion.span>
              {t("triage.live")}
            </span>
            <span className="font-mono text-sm tabular-nums text-medical-glow/85">
              {hh}:{mm}:{ss}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={anyLoading}
              className="border-medical-cyan/40 bg-transparent text-medical-glow hover:bg-medical-cyan/10"
            >
              <RefreshCw
                className={`h-4 w-4 ${anyLoading ? "animate-spin" : ""}`}
                aria-hidden
              />
              <span className="ms-1 hidden sm:inline">
                {t("triage.refresh")}
              </span>
            </Button>
          </div>
        </header>

        <TriageStats counts={counts} total={patients.length} />
        <TriageStatsBar counts={counts} total={patients.length} />

        {patientsError && (
          <div className="rounded-xl border border-triage-red/40 bg-triage-red/10 p-6 text-sm text-triage-red">
            {patientsError}
          </div>
        )}

        {!patientsError && patients.length === 0 && (
          <GlowCard className="flex flex-col items-center gap-3 px-10 py-12 text-center">
            <div className="rounded-full border border-medical-cyan/30 bg-medical-cyan/10 p-3">
              <Users className="h-6 w-6 text-medical-glow" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("triage.empty")}
            </p>
          </GlowCard>
        )}

        <AnimatePresence>
          <motion.ul
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {sorted.map((p) => {
              const state = cardState[p.id] ?? { loading: false, error: false };
              const decision = triageDecisions[p.id] ?? null;
              return (
                <motion.li
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                >
                  <TriageCard
                    patient={p}
                    decision={decision}
                    startResult={startResults[p.id]}
                    loading={state.loading}
                    error={state.error}
                    onClick={() => navigate(`/patient/${p.id}`)}
                  />
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
