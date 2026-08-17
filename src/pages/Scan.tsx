import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Camera,
  CheckCircle2,
  Loader2,
  ScanSearch,
  XCircle,
} from "lucide-react";

import { IrisScanner } from "@/components/iris/IrisScanner";
import { MatchingStageVisual } from "@/components/iris/MatchingStageVisual";
import { SuccessOverlay } from "@/components/iris/SuccessOverlay";
import { PilgrimAvatar } from "@/components/patient/PilgrimAvatar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useIrisMatching, type MatchingStage } from "@/hooks/useIrisMatching";
import { fetchAllPatients, fetchPatient } from "@/lib/patients";
import type { IrisData } from "@/lib/mediapipe";
import { cn } from "@/lib/utils";
import { playSoftClick } from "@/lib/sounds";
import { useAppStore } from "@/store/appStore";
import type { Patient, TriageColor } from "@/types/patient";

const TRIAGE_DOT: Record<TriageColor, string> = {
  red: "bg-triage-red",
  green: "bg-triage-green",
};

export default function Scan() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const latestIrisRef = useRef<IrisData | null>(null);
  const [irisReady, setIrisReady] = useState(false);

  const scanMode = useAppStore((s) => s.scanMode);
  const setScanMode = useAppStore((s) => s.setScanMode);
  const demoTarget = useAppStore((s) => s.demoTargetPilgrimId);
  const setDemoTarget = useAppStore((s) => s.setDemoTargetPilgrimId);
  const setCurrentPatientId = useAppStore((s) => s.setCurrentPatientId);

  const { stage, result, error, run, reset } = useIrisMatching();
  const [successPatient, setSuccessPatient] = useState<Patient | null>(null);

  const handleIris = useCallback((data: IrisData) => {
    latestIrisRef.current = data;
    setIrisReady((prev) => (prev ? prev : true));
  }, []);

  const handleIdentify = useCallback(() => {
    playSoftClick();
    const video = videoRef.current;
    const iris = latestIrisRef.current;
    if (!video || !iris) return;
    run(video, iris);
  }, [run]);

  useEffect(() => {
    if (stage !== "success" || !result) {
      setSuccessPatient(null);
      return;
    }
    let cancelled = false;
    fetchPatient(result.pilgrimId)
      .then((p) => {
        if (cancelled) return;
        setSuccessPatient(p);
      })
      .catch(() => {
        if (cancelled) return;
        setSuccessPatient(null);
      });
    return () => {
      cancelled = true;
    };
  }, [stage, result]);

  const handleSuccessComplete = useCallback(() => {
    if (!result) return;
    setCurrentPatientId(result.pilgrimId);
    navigate(`/patient/${result.pilgrimId}`);
  }, [navigate, result, setCurrentPatientId]);

  const busy =
    stage === "capturing" || stage === "extracting" || stage === "matching";

  return (
    <PageTransition>
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-wide text-medical-glow">
            {t("scan.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("scan.subtitle")}</p>
        </header>

        <div className="relative">
          <IrisScanner ref={videoRef} onIrisDetected={handleIris} />
        </div>

        <ModeControls
          scanMode={scanMode}
          setScanMode={setScanMode}
          demoTarget={demoTarget}
          setDemoTarget={setDemoTarget}
          disabled={busy || stage === "success"}
        />

        <div className="min-h-[180px]">
          <AnimatePresence mode="wait">
            {stage === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex justify-end"
              >
                <IdentifyButton
                  ready={irisReady}
                  onClick={handleIdentify}
                />
              </motion.div>
            )}

            {busy && (
              <motion.div
                key="busy"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4 md:flex-row md:items-stretch"
              >
                <div className="md:flex-1">
                  <StageIndicator stage={stage} />
                </div>
                <div className="md:w-[240px]">
                  <MatchingStageVisual
                    stage={stage}
                    matchedPilgrimId={result?.pilgrimId ?? demoTarget}
                  />
                </div>
              </motion.div>
            )}

            {stage === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <GlowCard
                  className="flex flex-col gap-3 p-5"
                  interactive={false}
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="h-6 w-6 text-red-400" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-red-200">
                        {t("scan.failed.title")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {error ?? t("scan.failed.message")}
                      </div>
                    </div>
                  </div>
                  {result && (
                    <div className="font-mono text-xs text-muted-foreground">
                      {t("scan.success.similarity")}:{" "}
                      {(result.similarity * 100).toFixed(1)}%
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={reset}>
                      {t("scan.failed.retry")}
                    </Button>
                  </div>
                </GlowCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {stage === "success" && result && successPatient && (
          <SuccessOverlay
            patient={successPatient}
            similarity={result.similarity}
            onComplete={handleSuccessComplete}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  );
}

interface IdentifyButtonProps {
  ready: boolean;
  onClick: () => void;
}

function IdentifyButton({ ready, onClick }: IdentifyButtonProps) {
  const { t } = useTranslation();

  if (!ready) {
    return (
      <Button
        size="lg"
        disabled
        className="relative min-w-48 overflow-hidden border border-medical-cyan/15 bg-medical-surface/40 text-muted-foreground opacity-70"
      >
        <span className="relative z-10">{t("scan.awaiting")}</span>
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-medical-cyan/15 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: ["-100%", "300%"] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={onClick}
      className="min-w-48 bg-medical-cyan text-medical-deep shadow-[0_0_30px_rgba(34,211,238,0.55)] transition-all hover:bg-medical-glow hover:shadow-[0_0_45px_rgba(34,211,238,0.85)]"
    >
      {t("scan.button.identify")}
    </Button>
  );
}

interface ModeControlsProps {
  scanMode: "live" | "demo";
  setScanMode: (mode: "live" | "demo") => void;
  demoTarget: string | null;
  setDemoTarget: (id: string | null) => void;
  disabled: boolean;
}

function ModeControls({
  scanMode,
  setScanMode,
  demoTarget,
  setDemoTarget,
  disabled,
}: ModeControlsProps) {
  const { t } = useTranslation();
  const modes: Array<"live" | "demo"> = ["live", "demo"];

  return (
    <div className="flex flex-col gap-3">
      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-medical-cyan/30 bg-medical-surface/60 p-1 text-xs font-semibold backdrop-blur-sm">
        {modes.map((m) => {
          const active = scanMode === m;
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => {
                playSoftClick();
                setScanMode(m);
              }}
              className={cn(
                "relative rounded-full px-4 py-1.5 uppercase tracking-[0.2em] transition-colors disabled:opacity-50",
                active ? "text-white" : "text-muted-foreground hover:text-medical-glow",
              )}
            >
              {active && (
                <motion.span
                  layoutId="scan-mode-pill"
                  className="absolute inset-0 rounded-full bg-medical-cyan shadow-[0_0_18px_rgba(34,211,238,0.55)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t(`scan.mode.${m}`)}</span>
            </button>
          );
        })}
      </div>

      {scanMode === "demo" && (
        <DemoPilgrimPicker
          demoTarget={demoTarget}
          setDemoTarget={setDemoTarget}
          disabled={disabled}
        />
      )}
    </div>
  );
}

interface DemoPilgrimPickerProps {
  demoTarget: string | null;
  setDemoTarget: (id: string | null) => void;
  disabled: boolean;
}

function DemoPilgrimPicker({
  demoTarget,
  setDemoTarget,
  disabled,
}: DemoPilgrimPickerProps) {
  const [pilgrims, setPilgrims] = useState<Patient[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllPatients()
      .then((all) => {
        if (cancelled) return;
        setPilgrims(all.slice(0, 5));
      })
      .catch(() => {
        if (cancelled) return;
        setPilgrims([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {pilgrims.map((p) => {
        const selected = demoTarget === p.id;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              playSoftClick();
              setDemoTarget(p.id);
            }}
            className={cn(
              "group flex shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-medical-surface/40 p-2 text-xs transition-all disabled:opacity-50",
              selected
                ? "scale-105 border-medical-cyan/70 shadow-[0_0_22px_rgba(34,211,238,0.5)]"
                : "border-medical-cyan/15 hover:border-medical-cyan/40",
            )}
            style={{ width: 100 }}
          >
            <div
              className={cn(
                "relative h-16 w-16 overflow-hidden rounded-full border-2 transition-colors",
                selected ? "border-medical-cyan" : "border-medical-cyan/20",
              )}
            >
              <PilgrimAvatar patient={p} size={60} />
            </div>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  TRIAGE_DOT[p.demoSeverity],
                )}
              />
              <span className="max-w-[70px] truncate text-[10px] text-medical-glow/90">
                {p.fullName.en.split(" ")[0]}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const STAGE_ORDER: MatchingStage[] = ["capturing", "extracting", "matching"];

function StageIndicator({ stage }: { stage: MatchingStage }) {
  const { t } = useTranslation();
  const currentIdx = STAGE_ORDER.indexOf(stage);

  const icons: Record<string, React.ReactNode> = useMemo(
    () => ({
      capturing: <Camera className="h-4 w-4" />,
      extracting: <Brain className="h-4 w-4" />,
      matching: <ScanSearch className="h-4 w-4" />,
    }),
    [],
  );

  return (
    <GlowCard className="flex h-full flex-col gap-3 p-5" interactive={false}>
      {STAGE_ORDER.map((s, i) => {
        const status =
          i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
        return (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: status === "pending" ? 0.4 : 1,
              x: 0,
            }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1 text-sm",
              status === "active" && "text-medical-glow",
              status === "done" && "text-emerald-300",
              status === "pending" && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border",
                status === "active" &&
                  "border-medical-cyan/50 bg-medical-cyan/10",
                status === "done" &&
                  "border-emerald-400/40 bg-emerald-500/10",
                status === "pending" && "border-muted/30 bg-transparent",
              )}
            >
              {status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === "done" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                icons[s]
              )}
            </span>
            <span>{t(`scan.stage.${s}`)}</span>
            {status === "active" && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0.2 }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="ms-auto h-1 w-16 rounded-full bg-medical-cyan/40"
              />
            )}
          </motion.div>
        );
      })}
    </GlowCard>
  );
}
