import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Pill,
  ShieldAlert,
  Scissors,
  Activity,
  Heart,
  Wind,
  Brain,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BioSkeleton } from "@/components/ui/bio-skeleton";
import { useCyclingMessage } from "@/lib/loading-messages";
import type {
  Criticality,
  FactIcon,
  LifeSavingFact,
  LifeSavingFactsResponse,
} from "@/types/ai";
import type { Patient } from "@/types/patient";
import { DEMO_ONLY } from "@/lib/demo";
import { DemoNotice } from "@/components/ui/demo-notice";

const ICON_MAP: Record<FactIcon, LucideIcon> = {
  alert: AlertTriangle,
  pill: Pill,
  allergy: ShieldAlert,
  surgery: Scissors,
  condition: Activity,
  heart: Heart,
  lung: Wind,
  brain: Brain,
};

const CRITICALITY_DOT: Record<Criticality, string> = {
  high: "bg-triage-red shadow-[0_0_10px_rgba(239,68,68,0.7)]",
  medium: "bg-triage-orange shadow-[0_0_10px_rgba(249,115,22,0.6)]",
  low: "bg-triage-green shadow-[0_0_10px_rgba(34,197,94,0.5)]",
};

const NUMBER_GLYPH = ["❶", "❷", "❸"];

export interface TopThreeFactsProps {
  patient: Patient;
  facts: LifeSavingFactsResponse | null;
  loading: boolean;
  error: boolean;
}

export function TopThreeFacts({
  patient,
  facts,
  loading,
  error,
}: TopThreeFactsProps) {
  const { t } = useTranslation();

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-triage-red/40 bg-gradient-to-br from-medical-surface/90 to-medical-deep/90 p-5 sm:p-7",
        "shadow-[0_0_40px_rgba(239,68,68,0.25)] backdrop-blur-sm",
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-triage-red opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-triage-red" />
        </span>
        <h2 className="flex flex-1 items-center gap-2 text-base font-bold uppercase tracking-[0.18em] text-triage-red sm:text-lg">
          <Sparkles className="h-4 w-4 text-medical-glow" aria-hidden />
          {t("profile.topFacts.title")}
        </h2>
      </div>

      {loading && <LoadingState />}

      {!loading && error && (
        <ErrorFallback patient={patient} message={t("profile.topFacts.error")} />
      )}

      {!loading && !error && facts && (
        <AnimatePresence mode="wait">
          <motion.ul
            key={patient.id}
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.2 } },
            }}
          >
            {facts.facts.slice(0, 3).map((fact, idx) => (
              <FactRow key={fact.id} fact={fact} index={idx} />
            ))}
          </motion.ul>
        </AnimatePresence>
      )}
    </section>
  );
}

function FactRow({ fact, index }: { fact: LifeSavingFact; index: number }) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[fact.icon] ?? AlertTriangle;
  const critLabel = t(`profile.topFacts.criticality.${fact.criticality}`);

  async function handleCopy() {
    const payload = `${fact.title}: ${fact.content}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
      }
      toast.success(t("toast.factCopied"));
    } catch {
      toast.error(t("toast.factCopied"));
    }
  }

  return (
    <motion.li
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 0 22px rgba(34,211,238,0.25)",
        borderColor: "rgba(34,211,238,0.45)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      className="group cursor-pointer rounded-xl border border-medical-cyan/15 bg-medical-deep/40 p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-medical-cyan/60"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex-shrink-0 text-3xl font-bold text-medical-glow drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
        >
          {NUMBER_GLYPH[index] ?? `${index + 1}.`}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <Icon
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-medical-glow"
              aria-hidden
            />
            <h3 className="text-base font-bold leading-snug text-foreground sm:text-lg">
              {fact.title}
            </h3>
          </div>

          <p className="text-sm leading-relaxed text-foreground/85">
            {fact.content}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/80",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  CRITICALITY_DOT[fact.criticality],
                )}
              />
              {critLabel}
            </span>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-medical-cyan/40 bg-medical-cyan/5 px-3 py-1.5 text-sm font-medium text-medical-glow transition-transform duration-200 ease-out group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" aria-hidden />
              {fact.actionRecommended}
            </span>
          </div>
        </div>
      </div>
    </motion.li>
  );
}

function LoadingState() {
  const { t } = useTranslation();
  const messages = [
    t("loading.ai.0"),
    t("loading.ai.1"),
    t("loading.ai.2"),
  ];
  const message = useCyclingMessage(messages);

  return (
    <div className="relative space-y-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-20 animate-scan-line bg-gradient-to-b from-transparent via-medical-glow/30 to-transparent"
      />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-medical-cyan/15 bg-medical-deep/40 p-4"
        >
          <div className="flex items-start gap-4">
            <BioSkeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <BioSkeleton className="h-4 w-3/4" />
              <BioSkeleton className="h-3 w-full" />
              <BioSkeleton className="h-3 w-5/6" />
              <BioSkeleton className="h-6 w-1/2" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 pt-1 text-sm font-medium text-medical-glow">
        <Sparkles className="h-4 w-4 animate-pulse" aria-hidden />
        <AnimatePresence mode="wait">
          <motion.span
            key={message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {message}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ErrorFallback({
  patient,
  message,
}: {
  patient: Patient;
  message: string;
}) {
  const fallbackFacts = buildFallbackFacts(patient);

  return (
    <div className="space-y-4">
      {DEMO_ONLY ? (
        <DemoNotice />
      ) : (
        <div className="rounded-md border border-triage-red/40 bg-triage-red/10 p-3 text-sm text-triage-red">
          {message}
        </div>
      )}
      <ul className="space-y-3">
        {fallbackFacts.map((line, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-medical-cyan/15 bg-medical-deep/40 p-3 text-sm text-foreground/85"
          >
            <span className="text-2xl text-medical-glow">{NUMBER_GLYPH[i]}</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildFallbackFacts(patient: Patient): string[] {
  const lines: string[] = [];
  const lifeThreatening = patient.allergies.find(
    (a) => a.severity === "life-threatening",
  );
  const firstAllergy = lifeThreatening ?? patient.allergies[0];
  if (firstAllergy) {
    lines.push(
      `Allergy: ${firstAllergy.substance} — ${firstAllergy.reaction} (${firstAllergy.severity}).`,
    );
  }

  const severeCondition =
    patient.chronicConditions.find((c) => c.severity === "severe") ??
    patient.chronicConditions[0];
  if (severeCondition) {
    lines.push(
      `Condition: ${severeCondition.name} (${severeCondition.severity}, since ${severeCondition.diagnosedYear}).`,
    );
  }

  const recentSurgery = [...patient.surgeries].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];
  if (recentSurgery) {
    lines.push(`Surgery: ${recentSurgery.procedure} (${recentSurgery.date}).`);
  }

  if (lines.length === 0) {
    lines.push("No critical history on file.");
  }

  return lines.slice(0, 3);
}
