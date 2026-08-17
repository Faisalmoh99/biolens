import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, AlertCircle, ArrowRight, Hospital as HospitalIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { TriageBadge } from "@/components/ui/triage-badge";
import { useCyclingMessage } from "@/lib/loading-messages";
import type { Patient, TriageColor } from "@/types/patient";
import type { TriageContextDecision } from "@/types/ai";
import type { TriageResult } from "@/lib/triage";

const COUNTRY_FLAG: Record<string, string> = {
  Indonesia: "🇮🇩",
  Pakistan: "🇵🇰",
  Türkiye: "🇹🇷",
  Turkey: "🇹🇷",
  Nigeria: "🇳🇬",
  Egypt: "🇪🇬",
};

const BAND_BG: Record<TriageColor, string> = {
  red: "bg-triage-red",
  green: "bg-triage-green",
};

const BORDER_RING: Record<TriageColor, string> = {
  red: "border-triage-red/40 hover:border-triage-red hover:shadow-[0_0_30px_rgba(239,68,68,0.45)]",
  green:
    "border-triage-green/40 hover:border-triage-green hover:shadow-[0_0_25px_rgba(34,197,94,0.35)]",
};

const PULSE_SHADOWS: Partial<Record<TriageColor, string[]>> = {
  red: [
    "0 0 20px rgba(239,68,68,0.3)",
    "0 0 40px rgba(239,68,68,0.5)",
    "0 0 20px rgba(239,68,68,0.3)",
  ],
};

interface VitalChipProps {
  label: string;
  value: string | number;
  alert: boolean;
}

function VitalChip({ label, value, alert }: VitalChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] tabular-nums",
        alert
          ? "border-triage-red/60 bg-triage-red/15 text-triage-red shadow-[0_0_10px_rgba(239,68,68,0.3)]"
          : "border-medical-cyan/20 bg-medical-deep/60 text-foreground/85",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider text-foreground/55">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

export interface TriageCardProps {
  patient: Patient;
  decision: TriageContextDecision | null;
  startResult: TriageResult;
  loading: boolean;
  error?: boolean;
  onClick?: () => void;
}

export function TriageCard({
  patient,
  decision,
  startResult,
  loading,
  error,
  onClick,
}: TriageCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const color: TriageColor = decision?.finalColor ?? startResult.color;
  const flag = COUNTRY_FLAG[patient.nationality.en] ?? "🌐";

  const v = patient.demoVitals;
  const hrAlert = v.heartRate < 50 || v.heartRate > 130;
  const bpAlert = v.systolicBP < 90 || v.systolicBP > 180;
  const spo2Alert = v.spo2 < 92;

  const complaint = patient.demoPresentingComplaint[lang];
  const fullName = patient.fullName[lang];

  const pulseShadows = PULSE_SHADOWS[color];

  // Track when the AI decision first lands so we can shimmer-wash the
  // immediate-actions area before content fades in.
  const [shimmerActive, setShimmerActive] = useState(false);
  const prevHadDecisionRef = useRef(!!decision);
  useEffect(() => {
    const had = prevHadDecisionRef.current;
    prevHadDecisionRef.current = !!decision;
    if (!had && decision) {
      setShimmerActive(true);
      const id = window.setTimeout(() => setShimmerActive(false), 200);
      return () => window.clearTimeout(id);
    }
  }, [decision]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      animate={
        pulseShadows
          ? { boxShadow: pulseShadows }
          : undefined
      }
      transition={
        pulseShadows
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      className={cn(
        "group relative flex w-full gap-0 overflow-hidden rounded-2xl border-2 bg-medical-surface/70 text-start backdrop-blur-sm transition-colors",
        BORDER_RING[color],
      )}
    >
      <span
        aria-hidden
        className={cn("w-1.5 flex-shrink-0 self-stretch", BAND_BG[color])}
      />

      <div className="flex-1 p-4 sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TriageBadge color={color} />
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground sm:text-lg">
                {fullName}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {patient.age} yo · {patient.sex} ·{" "}
                <span className="text-base leading-none">{flag}</span>{" "}
                <span className="text-foreground/75">
                  {patient.nationality[lang]}
                </span>
              </p>
            </div>
          </div>
        </header>

        <p className="mt-3 line-clamp-2 text-sm leading-snug text-foreground/85">
          {complaint}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <VitalChip label={t("profile.vitals.hr")} value={v.heartRate} alert={hrAlert} />
          <VitalChip
            label={t("profile.vitals.bp")}
            value={`${v.systolicBP}/${v.diastolicBP}`}
            alert={bpAlert}
          />
          <VitalChip
            label={t("profile.vitals.spo2")}
            value={`${v.spo2}%`}
            alert={spo2Alert}
          />
          <VitalChip
            label={t("profile.vitals.rr")}
            value={v.respRate}
            alert={v.respRate > 30 || v.respRate < 10}
          />
        </div>

        <div className="relative mt-4 overflow-hidden rounded-xl border border-medical-cyan/15 bg-medical-deep/40 p-3">
          <AnimatePresence>
            {shimmerActive && (
              <motion.span
                key="ai-shimmer"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-medical-cyan/30 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            )}
          </AnimatePresence>

          <div className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-medical-glow">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("triage.card.aiActions")}
          </div>

          {loading && !decision && <TriageLoadingMessage />}

          {!loading && error && !decision && (
            <div className="mt-2 flex items-center gap-2 text-sm text-triage-orange">
              <AlertCircle className="h-4 w-4" aria-hidden />
              {t("triage.card.aiError")}
            </div>
          )}

          {decision && (
            <motion.ul
              className="relative mt-2 space-y-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.18 }}
            >
              {decision.immediateActions.slice(0, 3).map((action, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-foreground/90"
                >
                  <ArrowRight
                    className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-medical-glow"
                    aria-hidden
                  />
                  <span className="leading-snug">{action}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </div>

        {decision && (
          <footer className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-md border border-medical-cyan/25 bg-medical-cyan/5 px-2 py-0.5 font-medium text-medical-glow">
              {t("triage.card.confidence")}: {Math.round(decision.confidence * 100)}%
            </span>
            {decision.adjustedFromStart && (
              <span className="rounded-md border border-triage-orange/40 bg-triage-orange/10 px-2 py-0.5 font-medium text-triage-orange">
                {t("triage.card.adjusted")}
              </span>
            )}
          </footer>
        )}

        {color === "red" && (
          <div
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/patient/${patient.id}?openHandoff=1`);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/patient/${patient.id}?openHandoff=1`);
              }
            }}
            className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[12px] text-foreground/60 underline-offset-4 transition-colors hover:text-medical-glow hover:underline focus:outline-none focus:ring-2 focus:ring-medical-cyan/60"
          >
            <HospitalIcon className="h-3.5 w-3.5" aria-hidden />
            {t("handoff.findHospital")}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function TriageLoadingMessage() {
  const { t } = useTranslation();
  const messages = [
    t("loading.triage.0"),
    t("loading.triage.1"),
    t("loading.triage.2"),
  ];
  const message = useCyclingMessage(messages);
  return (
    <div className="relative mt-2 flex items-center gap-2 text-sm text-medical-glow/80">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-medical-glow opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-medical-glow" />
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
