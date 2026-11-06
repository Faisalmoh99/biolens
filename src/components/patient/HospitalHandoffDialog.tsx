import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  BedDouble,
  Check,
  Edit3,
  RefreshCcw,
  Send,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCyclingMessage } from "@/lib/loading-messages";
import { generateHandoffSummary } from "@/lib/hospital-handoff";
import { useAppStore } from "@/store/appStore";
import type { Patient } from "@/types/patient";
import type { RankedHospital } from "@/types/hospital";
import type { HandoffSummary } from "@/types/ai";
import { DEMO_ONLY } from "@/lib/demo";
import { DemoNotice } from "@/components/ui/demo-notice";

interface HospitalHandoffDialogProps {
  patient: Patient;
  ranked: RankedHospital[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_STYLES: Record<
  RankedHospital["hospital"]["edStatus"],
  string
> = {
  open: "border-triage-green/50 bg-triage-green/10 text-triage-green",
  limited: "border-triage-orange/50 bg-triage-orange/10 text-triage-orange",
  diversion: "border-triage-red/50 bg-triage-red/10 text-triage-red",
};

function formatTimeHHMM(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatCombinedBlock(
  summary: HandoffSummary,
  etaMin: number,
  labels: {
    oneLiner: string;
    vitals: string;
    allergies: string;
    currentMeds: string;
    criticalNotes: string;
    eta: string;
  },
): string {
  return [
    `${labels.oneLiner}: ${summary.oneLiner}`,
    `${labels.vitals}: ${summary.vitals}`,
    `${labels.allergies}: ${summary.allergies}`,
    `${labels.currentMeds}: ${summary.currentMeds}`,
    `${labels.criticalNotes}: ${summary.criticalNotes}`,
    `${labels.eta}: ${etaMin} min`,
  ].join("\n");
}

export function HospitalHandoffDialog({
  patient,
  ranked,
  open,
  onOpenChange,
}: HospitalHandoffDialogProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const handoffSummaryCache = useAppStore((s) => s.handoffSummaryCache);
  const setHandoffSummary = useAppStore((s) => s.setHandoffSummary);
  const logHandoff = useAppStore((s) => s.logHandoff);
  const handoffLog = useAppStore((s) => s.handoffLog);

  const top3 = useMemo(() => ranked.slice(0, 3), [ranked]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<HandoffSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedBlock, setEditedBlock] = useState("");
  const [transmitting, setTransmitting] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const fetchedForOpenRef = useRef(false);

  // Reset state on open / pre-select rank 0
  useEffect(() => {
    if (!open) {
      fetchedForOpenRef.current = false;
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setSelectedId(top3[0]?.hospital.id ?? null);
    setEditing(false);
    setTransmitting(false);
    const cached = handoffSummaryCache[patient.id];
    if (cached) {
      setSummary(cached);
      setLoading(false);
      setError(false);
    } else {
      setSummary(null);
      setError(false);
      setLoading(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, patient.id, top3, handoffSummaryCache]);

  // Fetch summary on first open if not cached
  useEffect(() => {
    if (!open || fetchedForOpenRef.current) return;
    const cached = handoffSummaryCache[patient.id];
    if (cached) {
      fetchedForOpenRef.current = true;
      return;
    }
    fetchedForOpenRef.current = true;
    void runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient.id]);

  // Clean up close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  const selected = top3.find((r) => r.hospital.id === selectedId) ?? top3[0];
  const existingLog = handoffLog[patient.id];

  async function runGenerate() {
    if (DEMO_ONLY) {
      // Demo builds serve cached summaries only; never call Gemini.
      setSummary(null);
      setError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    setSummary(null);
    try {
      const result = await generateHandoffSummary(patient);
      setSummary(result);
      setHandoffSummary(patient.id, result);
    } catch (err) {
      console.error("[Handoff] generation failed", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    if (!selected) return;
    setTransmitting(true);
    const hospitalName = selected.hospital.shortName[lang];
    const etaMin = selected.etaMin;
    toast.success(
      t("handoff.toast.sent", { hospital: hospitalName, min: etaMin }),
    );
    logHandoff(patient.id, {
      hospitalId: selected.hospital.id,
      hospitalName,
      etaMin,
    });
    closeTimerRef.current = window.setTimeout(() => {
      setTransmitting(false);
      onOpenChange(false);
    }, 1400);
  }

  function handleEditToggle() {
    if (!summary || !selected) return;
    if (editing) {
      setEditing(false);
      return;
    }
    setEditedBlock(
      formatCombinedBlock(summary, selected.etaMin, {
        oneLiner: t("handoff.fields.oneLiner"),
        vitals: t("handoff.fields.vitals"),
        allergies: t("handoff.fields.allergies"),
        currentMeds: t("handoff.fields.currentMeds"),
        criticalNotes: t("handoff.fields.criticalNotes"),
        eta: t("handoff.fields.eta"),
      }),
    );
    setEditing(true);
  }

  const buttonLabel = selected
    ? existingLog
      ? t("handoff.resend")
      : t("handoff.send", { hospital: selected.hospital.shortName[lang] })
    : t("handoff.send", { hospital: "" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-h-[90vh] max-w-3xl overflow-y-auto border-medical-cyan/30 bg-medical-deep p-0">
        {/* Transmission sweep */}
        <AnimatePresence>
          {transmitting && (
            <motion.div
              key="transmission-sweep"
              className="pointer-events-none absolute inset-x-0 top-1/2 z-[60] h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-medical-cyan to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)]"
              initial={{ x: "-100%", opacity: 0.7 }}
              animate={{ x: "100%", opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="border-b border-medical-cyan/20 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-medical-glow">
            {t("handoff.title")}
          </DialogTitle>
          <p className="mt-1 text-xs text-foreground/70">
            {patient.fullName[lang]} · {patient.age}yo {patient.sex}
          </p>
        </div>

        {/* Hospital options */}
        <div className="space-y-3 px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-medical-glow">
            {t("handoff.selectHospital")}
          </h3>
          <div className="grid gap-2">
            {top3.map((r) => {
              const isSelected = r.hospital.id === selectedId;
              return (
                <button
                  key={r.hospital.id}
                  type="button"
                  onClick={() => setSelectedId(r.hospital.id)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-xl border bg-medical-surface/40 p-3 text-start transition-colors",
                    isSelected
                      ? "border-medical-cyan/60"
                      : "border-medical-cyan/15 hover:border-medical-cyan/40",
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="handoff-selection-glow"
                      className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-medical-cyan/60 shadow-[0_0_25px_rgba(34,211,238,0.25)]"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <div className="relative flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-foreground">
                        {r.hospital.shortName[lang]}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          STATUS_STYLES[r.hospital.edStatus],
                        )}
                      >
                        {t(`handoff.status.${r.hospital.edStatus}`)}
                      </span>
                    </div>
                    <div className="text-xs tabular-nums text-foreground/60">
                      {t("handoff.distanceKm", {
                        km: r.distanceKm.toFixed(1),
                      })}{" "}
                      · {t("handoff.etaMin", { min: r.etaMin })}
                    </div>
                  </div>
                  {r.matchedSpecialties.length > 0 && (
                    <div className="relative mt-2 flex flex-wrap gap-1.5">
                      {r.matchedSpecialties.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-medical-cyan/40 bg-medical-cyan/10 px-2 py-0.5 text-[10px] font-medium text-medical-glow"
                        >
                          {t(`handoff.specialty.${s}`)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="relative mt-2 flex items-center gap-1.5 text-xs text-foreground/70">
                    <BedDouble className="h-3 w-3" aria-hidden />
                    {t("handoff.beds", { count: r.hospital.bedsAvailable })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary panel */}
        <div className="border-t border-medical-cyan/10 px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-medical-glow">
              {t("handoff.summaryTitle")}
            </h3>
            {summary && !loading && !error && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEditToggle}
                className="h-7 text-medical-glow/80 hover:bg-medical-cyan/10 hover:text-medical-glow"
              >
                {editing ? (
                  <>
                    <Check className="h-3 w-3" />
                    {t("handoff.done")}
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3 w-3" />
                    {t("handoff.edit")}
                  </>
                )}
              </Button>
            )}
          </div>

          {loading && <HandoffLoadingState />}

          {DEMO_ONLY && !summary && !loading && <DemoNotice />}

          {error && !loading && (
            <div className="space-y-2 rounded-md border border-triage-red/40 bg-triage-red/10 p-3 text-sm text-triage-red">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <span>{t("handoff.error")}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void runGenerate()}
                className="border-triage-red/40 text-triage-red hover:bg-triage-red/10"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                {t("handoff.retry")}
              </Button>
            </div>
          )}

          {summary && !loading && !error && selected && !editing && (
            <div className="space-y-2 rounded-xl border border-medical-cyan/20 bg-medical-surface/60 p-4 text-sm">
              <SummaryLine
                label={t("handoff.fields.oneLiner")}
                value={summary.oneLiner}
              />
              <SummaryLine
                label={t("handoff.fields.vitals")}
                value={summary.vitals}
              />
              <SummaryLine
                label={t("handoff.fields.allergies")}
                value={summary.allergies}
              />
              <SummaryLine
                label={t("handoff.fields.currentMeds")}
                value={summary.currentMeds}
              />
              <SummaryLine
                label={t("handoff.fields.criticalNotes")}
                value={summary.criticalNotes}
              />
              <SummaryLine
                label={t("handoff.fields.eta")}
                value={`${selected.etaMin} min`}
              />
            </div>
          )}

          {summary && !loading && !error && editing && (
            <textarea
              value={editedBlock}
              onChange={(e) => setEditedBlock(e.target.value)}
              className="min-h-[180px] w-full resize-y rounded-md border border-medical-cyan/40 bg-medical-surface/60 px-3 py-2 text-sm text-foreground focus:border-medical-cyan/80 focus:outline-none"
              autoFocus
            />
          )}
        </div>

        {/* Sticky Send button */}
        <div className="sticky bottom-0 z-10 border-t border-medical-cyan/20 bg-medical-deep/95 px-6 py-3 backdrop-blur-sm">
          <Button
            onClick={handleSend}
            disabled={!selected || transmitting}
            className="w-full bg-triage-red text-white hover:bg-triage-red/90"
          >
            {transmitting ? (
              <>{t("handoff.sending")}</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {buttonLabel}
              </>
            )}
          </Button>
          {existingLog && !transmitting && (
            <p className="mt-2 text-center text-xs text-foreground/60">
              {t("handoff.sentAt", { time: formatTimeHHMM(existingLog.sentAt) })}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wider text-medical-glow">
        {label}
      </span>
      <span className="text-foreground/90">{value}</span>
    </div>
  );
}

function HandoffLoadingState() {
  const { t } = useTranslation();
  const messages = useMemo(
    () => [
      t("loading.handoff.0"),
      t("loading.handoff.1"),
      t("loading.handoff.2"),
      t("loading.handoff.3"),
    ],
    [t],
  );
  const message = useCyclingMessage(messages, 1200);
  return (
    <div className="flex items-center gap-2 rounded-md border border-medical-cyan/20 bg-medical-surface/40 px-3 py-3 text-sm text-medical-glow/80">
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
