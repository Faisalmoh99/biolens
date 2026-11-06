import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCcw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GlowCard } from "@/components/ui/glow-card";
import { cn } from "@/lib/utils";
import { playSoftClick } from "@/lib/sounds";
import {
  buildInteractionCacheKey,
  checkInteractions,
  defaultProposedInterventions,
  extractInterventionsFromActions,
} from "@/lib/drug-interactions";
import { DEMO_ONLY } from "@/lib/demo";
import { DemoNotice } from "@/components/ui/demo-notice";
import { fetchRecommendedInterventions } from "@/lib/drug-suggestions";
import { useCyclingMessage } from "@/lib/loading-messages";
import { useAppStore } from "@/store/appStore";
import type { Patient } from "@/types/patient";
import type {
  InteractionAlert,
  InteractionAnalysis,
  InteractionSeverity,
  InterventionUrgency,
  RecommendedIntervention,
} from "@/types/ai";

interface DrugInteractionsDialogProps {
  patient: Patient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmergencyChip {
  id: string;
  generic: string;
  labelKey: string;
}

const EMERGENCY_DRUG_CHIPS: EmergencyChip[] = [
  { id: "atropine", generic: "Atropine", labelKey: "interactions.chip.atropine" },
  { id: "epinephrine", generic: "Epinephrine", labelKey: "interactions.chip.epinephrine" },
  { id: "amiodarone", generic: "Amiodarone", labelKey: "interactions.chip.amiodarone" },
  { id: "vasopressin", generic: "Vasopressin", labelKey: "interactions.chip.vasopressin" },
  { id: "lidocaine", generic: "Lidocaine", labelKey: "interactions.chip.lidocaine" },
  { id: "heparin", generic: "Heparin", labelKey: "interactions.chip.heparin" },
  { id: "morphine", generic: "Morphine", labelKey: "interactions.chip.morphine" },
  { id: "furosemide", generic: "Furosemide", labelKey: "interactions.chip.furosemide" },
  { id: "naloxone", generic: "Naloxone", labelKey: "interactions.chip.naloxone" },
  { id: "adenosine", generic: "Adenosine", labelKey: "interactions.chip.adenosine" },
  { id: "magnesium", generic: "Magnesium", labelKey: "interactions.chip.magnesium" },
  {
    id: "calciumGluconate",
    generic: "Calcium gluconate",
    labelKey: "interactions.chip.calciumGluconate",
  },
];

const LOADING_STEPS = [
  "interactions.loading.0",
  "interactions.loading.1",
  "interactions.loading.2",
  "interactions.loading.3",
] as const;

const SEVERITY_ORDER: Record<InteractionSeverity, number> = {
  contraindicated: 0,
  major: 1,
  moderate: 2,
  minor: 3,
};

const SEVERITY_STYLES: Record<
  InteractionSeverity,
  { band: string; chip: string; icon: string; dot: string; labelKey: string }
> = {
  contraindicated: {
    band: "border-l-4 border-red-600",
    chip: "bg-red-600/20 text-red-200 border-red-500/60",
    icon: "text-red-400",
    dot: "🔴",
    labelKey: "interactions.severity.contraindicated",
  },
  major: {
    band: "border-l-4 border-red-500",
    chip: "bg-red-500/15 text-red-200 border-red-400/50",
    icon: "text-red-300",
    dot: "🔴",
    labelKey: "interactions.severity.major",
  },
  moderate: {
    band: "border-l-4 border-orange-500",
    chip: "bg-orange-500/15 text-orange-200 border-orange-400/50",
    icon: "text-orange-300",
    dot: "🟠",
    labelKey: "interactions.severity.moderate",
  },
  minor: {
    band: "border-l-4 border-yellow-500",
    chip: "bg-yellow-500/15 text-yellow-200 border-yellow-400/50",
    icon: "text-yellow-300",
    dot: "🟡",
    labelKey: "interactions.severity.minor",
  },
};

const URGENCY_STYLES: Record<
  InterventionUrgency,
  { band: string; chip: string; labelKey: string }
> = {
  immediate: {
    band: "border-l-4 border-red-500",
    chip: "bg-red-500/20 text-red-100 border-red-400/60",
    labelKey: "interactions.suggestions.urgency.immediate",
  },
  "within-5-min": {
    band: "border-l-4 border-amber-500",
    chip: "bg-amber-500/20 text-amber-100 border-amber-400/60",
    labelKey: "interactions.suggestions.urgency.within-5-min",
  },
  "monitor-first": {
    band: "border-l-4 border-medical-cyan",
    chip: "bg-medical-cyan/15 text-medical-glow border-medical-cyan/60",
    labelKey: "interactions.suggestions.urgency.monitor-first",
  },
};

function parseInterventions(text: string): string[] {
  return text
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function sortAlerts(alerts: InteractionAlert[]): InteractionAlert[] {
  return [...alerts].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

function suggestionToken(s: RecommendedIntervention): string {
  return `${s.generic} ${s.dose} ${s.route}`;
}

export function DrugInteractionsDialog({
  patient,
  open,
  onOpenChange,
}: DrugInteractionsDialogProps) {
  const { t } = useTranslation();
  const interactionCache = useAppStore((s) => s.interactionCache);
  const setInteractionAnalysis = useAppStore((s) => s.setInteractionAnalysis);
  const triageDecision = useAppStore((s) => s.triageDecisions[patient.id]);
  const cachedSuggestions = useAppStore(
    (s) => s.interventionSuggestionsCache[patient.id],
  );
  const setInterventionSuggestions = useAppStore(
    (s) => s.setInterventionSuggestions,
  );

  const currentMeds = useMemo(
    () => patient.medications.map((m) => m.generic),
    [patient.medications],
  );

  const initialIntervention = useMemo(() => {
    const actions = triageDecision?.immediateActions ?? [];
    // Demo builds: read-only, prefilled with exactly the set the precache
    // was built for (falls back to suggestion generics when triage names no drug).
    if (DEMO_ONLY) {
      return defaultProposedInterventions(
        actions,
        cachedSuggestions?.interventions,
      ).join(", ");
    }
    return extractInterventionsFromActions(actions).join(", ");
  }, [triageDecision, cachedSuggestions]);

  const [intervention, setIntervention] = useState(initialIntervention);
  const [analysis, setAnalysis] = useState<InteractionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fdaUnavailable, setFdaUnavailable] = useState(false);

  const [suggestions, setSuggestions] = useState<
    RecommendedIntervention[] | null
  >(cachedSuggestions?.interventions ?? null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [demoMiss, setDemoMiss] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressTimerRef = useRef<number | null>(null);
  const stepTimerRef = useRef<number | null>(null);

  const suggestionMessages = useMemo(
    () => [
      t("loading.suggestions.0"),
      t("loading.suggestions.1"),
      t("loading.suggestions.2"),
      t("loading.suggestions.3"),
    ],
    [t],
  );
  const cyclingSuggestion = useCyclingMessage(suggestionMessages, 1200);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setIntervention(initialIntervention);
    const interventions = parseInterventions(initialIntervention);
    const cacheKey = buildInteractionCacheKey(patient.id, interventions);
    const cached = interactionCache[cacheKey];
    setAnalysis(cached ?? null);
    setError(null);
    setFdaUnavailable(false);
    setDemoMiss(false);
    setProgress(0);
    setStepIdx(0);
    setLoading(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient.id, initialIntervention]);

  const loadSuggestions = async () => {
    if (DEMO_ONLY) return; // cached suggestions only
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const response = await fetchRecommendedInterventions(patient);
      setSuggestions(response.interventions);
      setInterventionSuggestions(patient.id, response);
    } catch (err) {
      console.error("[suggestions] fetch failed", err);
      setSuggestionsError(t("interactions.suggestions.error"));
      setSuggestions(null);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (cachedSuggestions) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSuggestions(cachedSuggestions.interventions);
      setSuggestionsError(null);
      setSuggestionsLoading(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    void loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient.id, cachedSuggestions]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current)
        window.clearInterval(progressTimerRef.current);
      if (stepTimerRef.current) window.clearInterval(stepTimerRef.current);
    };
  }, []);

  const appendChip = (generic: string) => {
    playSoftClick();
    setIntervention((prev) => {
      const trimmed = prev.trim();
      if (trimmed.length === 0) return generic;
      const existing = parseInterventions(prev).map((s) => s.toLowerCase());
      if (existing.includes(generic.toLowerCase())) return prev;
      return trimmed.endsWith(",") ? `${trimmed} ${generic}` : `${trimmed}, ${generic}`;
    });
    textareaRef.current?.focus();
  };

  const appendSuggestion = (s: RecommendedIntervention) => {
    playSoftClick();
    const token = suggestionToken(s);
    setIntervention((prev) => {
      if (prev.includes(token)) return prev;
      return `${prev}${token}. `;
    });
    textareaRef.current?.focus();
  };

  const appendAllSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return;
    playSoftClick();
    setIntervention((prev) => {
      let next = prev;
      for (const s of suggestions) {
        const token = suggestionToken(s);
        if (next.includes(token)) continue;
        next = `${next}${token}. `;
      }
      return next;
    });
    textareaRef.current?.focus();
  };

  const startProgressAnimation = () => {
    setProgress(0);
    setStepIdx(0);
    const total = 4000;
    const tick = 80;
    const increment = (100 / total) * tick;
    progressTimerRef.current = window.setInterval(() => {
      setProgress((p) => Math.min(95, p + increment));
    }, tick);
    stepTimerRef.current = window.setInterval(() => {
      setStepIdx((i) => Math.min(LOADING_STEPS.length - 1, i + 1));
    }, 1000);
  };

  const stopProgressAnimation = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (stepTimerRef.current) {
      window.clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    setProgress(100);
  };

  const runCheck = async (force: boolean) => {
    const interventions = parseInterventions(intervention);
    if (interventions.length === 0) return;

    const cacheKey = buildInteractionCacheKey(patient.id, interventions);
    if (DEMO_ONLY) {
      // Demo builds always serve the cache and never call Gemini/openFDA.
      const hit = interactionCache[cacheKey];
      if (hit) setAnalysis(hit);
      else setDemoMiss(true);
      return;
    }
    if (!force && interactionCache[cacheKey]) {
      setAnalysis(interactionCache[cacheKey]);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setFdaUnavailable(false);
    startProgressAnimation();

    try {
      const result = await checkInteractions(currentMeds, interventions);
      const totalDrugs = result.drugsAnalyzed.length || (currentMeds.length + interventions.length);
      const fdaMissCount = result.drugsNotFoundInFDA.length;
      if (totalDrugs > 0 && fdaMissCount === totalDrugs) {
        setFdaUnavailable(true);
      }
      setAnalysis(result);
      setInteractionAnalysis(cacheKey, result);
    } catch (err) {
      console.error("[interactions] generation failed", err);
      setError(t("interactions.error.failed"));
    } finally {
      stopProgressAnimation();
      setLoading(false);
    }
  };

  const handleCheck = () => {
    playSoftClick();
    void runCheck(false);
  };

  const handleRecheck = () => {
    playSoftClick();
    void runCheck(true);
  };

  const handleRetrySuggestions = () => {
    playSoftClick();
    void loadSuggestions();
  };

  const interventionEmpty = parseInterventions(intervention).length === 0;
  const stepCaption = t(LOADING_STEPS[stepIdx]);

  const sortedAlerts = useMemo(
    () => (analysis ? sortAlerts(analysis.alerts) : []),
    [analysis],
  );

  const summary = useMemo(() => {
    if (!analysis) return null;
    const n = analysis.drugsAnalyzed.length;
    const m = Math.max(0, n - analysis.drugsNotFoundInFDA.length);
    const k = analysis.drugsNotFoundInFDA.length;
    return { n, m, k };
  }, [analysis]);

  const allSuggestionsAdded = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return false;
    return suggestions.every((s) => intervention.includes(suggestionToken(s)));
  }, [suggestions, intervention]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-medical-cyan/30 bg-medical-deep p-0">
        {/* Header */}
        <div className="border-b border-medical-cyan/20 px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-medical-glow">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            {t("interactions.title")}
          </DialogTitle>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-medical-glow/60">
            {t("interactions.subtitle")}
          </p>
        </div>

        {/* Patient banner */}
        <div className="border-b border-medical-cyan/10 bg-medical-surface/40 px-6 py-3 text-sm text-foreground/80">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-medical-glow">
              {t("soap.patient")}:
            </span>
            <span>{patient.fullName.en}</span>
            <span className="text-foreground/30">·</span>
            <span>
              {patient.age}yo {patient.sex}
            </span>
            {patient.chronicConditions[0] && (
              <>
                <span className="text-foreground/30">·</span>
                <span>{patient.chronicConditions[0].name}</span>
              </>
            )}
          </div>
        </div>

        {/* AI-Recommended Interventions */}
        <div className="space-y-3 border-b border-medical-cyan/10 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-medical-glow">
                <Sparkles className="h-4 w-4" aria-hidden />
                {t("interactions.suggestions.title")}
              </h3>
              <p className="mt-1 text-xs text-foreground/60">
                {t("interactions.suggestions.subtitle")}
              </p>
            </div>
            {!DEMO_ONLY && suggestions && suggestions.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={appendAllSuggestions}
                disabled={allSuggestionsAdded}
                className="border-medical-cyan/40 text-medical-glow hover:bg-medical-cyan/10"
              >
                {t("interactions.suggestions.addAll")}
              </Button>
            )}
          </div>

          {suggestionsLoading && (
            <div className="rounded-md border border-medical-cyan/20 bg-medical-surface/40 px-3 py-4 text-sm text-medical-glow/80">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-medical-glow" />
                <span>{cyclingSuggestion}</span>
              </div>
            </div>
          )}

          {suggestionsError && !suggestionsLoading && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {suggestionsError}
              {!DEMO_ONLY && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRetrySuggestions}
                className="ml-2 h-7 text-red-100 hover:bg-red-500/20"
              >
                {t("interactions.suggestions.retry")}
              </Button>
              )}
            </div>
          )}

          {DEMO_ONLY && !suggestions && <DemoNotice />}

          {!suggestionsLoading && !suggestionsError && suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <SuggestionCard
                  key={`${s.generic}-${s.dose}-${idx}`}
                  suggestion={s}
                  alreadyAdded={intervention.includes(suggestionToken(s))}
                  onAdd={() => appendSuggestion(s)}
                  readOnly={DEMO_ONLY}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current medications */}
        <div className="space-y-3 px-6 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-medical-glow">
            {t("interactions.section.current")}
          </h3>
          {currentMeds.length === 0 ? (
            <p className="text-sm text-foreground/60">
              {t("interactions.empty.meds")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentMeds.map((med) => (
                <Badge
                  key={med}
                  variant="outline"
                  className="border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow"
                >
                  {med}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Proposed interventions */}
        <div className="space-y-3 px-6 pb-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-medical-glow">
            {t("interactions.section.proposed")}
          </h3>
          <textarea
            ref={textareaRef}
            value={intervention}
            onChange={(e) => setIntervention(e.target.value)}
            readOnly={DEMO_ONLY}
            placeholder={t("interactions.proposed.placeholder")}
            className="min-h-[80px] w-full resize-y rounded-md border border-medical-cyan/30 bg-medical-surface/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-medical-cyan/60 focus:outline-none"
            disabled={loading}
          />
          <div>
            <p className="mb-2 text-xs text-foreground/60">
              {t("interactions.section.quickAdd")}
            </p>
            <div className="flex flex-wrap gap-2">
              {EMERGENCY_DRUG_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => appendChip(chip.generic)}
                  disabled={loading || DEMO_ONLY}
                  className="disabled:opacity-50"
                >
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow transition-all hover:-translate-y-0.5 hover:border-medical-cyan/80 hover:bg-medical-cyan/15"
                  >
                    + {t(chip.labelKey)}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Action / progress */}
          <div className="pt-2">
            {loading ? (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-medical-glow/80">{stepCaption}</p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleCheck}
                  disabled={interventionEmpty}
                  className="bg-medical-cyan text-medical-deep hover:bg-medical-glow"
                >
                  {t("interactions.check")}
                </Button>
                {!DEMO_ONLY && analysis && (
                  <Button
                    variant="outline"
                    onClick={handleRecheck}
                    disabled={interventionEmpty}
                    className="border-medical-cyan/40 text-medical-glow hover:bg-medical-cyan/10"
                  >
                    <RefreshCcw className="h-4 w-4" aria-hidden />
                    {t("interactions.recheck")}
                  </Button>
                )}
              </div>
            )}
            {demoMiss && !loading && <DemoNotice className="mt-3" />}
            {error && !loading && (
              <div className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRecheck}
                  className="ml-2 h-7 text-red-100 hover:bg-red-500/20"
                >
                  {t("interactions.retry")}
                </Button>
              </div>
            )}
            {fdaUnavailable && analysis && (
              <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {t("interactions.error.fda")}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-3 border-t border-medical-cyan/10 px-6 py-5">
            {sortedAlerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" aria-hidden />
                <p className="text-sm font-medium">
                  {t("interactions.empty")}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {t("interactions.found", { count: sortedAlerts.length })}
                </div>
                <div className="space-y-3">
                  {sortedAlerts.map((alert, idx) => (
                    <AlertCard key={`${alert.drug1}-${alert.drug2}-${idx}`} alert={alert} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer summary */}
        {analysis && summary && !loading && (
          <div className="border-t border-medical-cyan/10 bg-medical-surface/40 px-6 py-3 text-xs text-foreground/60">
            {t("interactions.summary", {
              n: summary.n,
              m: summary.m,
              k: summary.k,
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuggestionCard({
  suggestion,
  alreadyAdded,
  onAdd,
  readOnly = false,
}: {
  suggestion: RecommendedIntervention;
  alreadyAdded: boolean;
  onAdd: () => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const styles = URGENCY_STYLES[suggestion.urgency];

  return (
    <GlowCard interactive={false} className={cn("p-0 overflow-hidden", styles.band)}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "uppercase tracking-wider text-[10px] font-bold",
                styles.chip,
              )}
            >
              {t(styles.labelKey)}
            </Badge>
            <span className="text-sm font-semibold text-foreground" dir="ltr">
              {suggestion.generic} {suggestion.dose} · {suggestion.route}
            </span>
          </div>
          <p className="text-xs text-foreground/80">{suggestion.rationale}</p>
        </div>
        {!readOnly && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={alreadyAdded}
          className="shrink-0 border-medical-cyan/40 text-medical-glow hover:bg-medical-cyan/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {alreadyAdded
            ? t("interactions.suggestions.added")
            : t("interactions.suggestions.add")}
        </Button>
        )}
      </div>
    </GlowCard>
  );
}

function AlertCard({ alert }: { alert: InteractionAlert }) {
  const { t } = useTranslation();
  const styles = SEVERITY_STYLES[alert.severity];
  const isFda = alert.sourceLabel === "openFDA";

  return (
    <GlowCard interactive={false} className={cn("p-0 overflow-hidden", styles.band)}>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "uppercase tracking-wider text-[10px] font-bold",
                styles.chip,
              )}
            >
              {t(styles.labelKey)}
            </Badge>
            <span className="text-sm font-semibold text-foreground">
              {alert.drug1} ↔ {alert.drug2}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider",
              isFda
                ? "border-medical-cyan/40 bg-medical-cyan/10 text-medical-glow"
                : "border-amber-500/40 bg-amber-500/10 text-amber-200",
            )}
          >
            {isFda ? t("interactions.source.fda") : t("interactions.source.ai")}
          </Badge>
        </div>
        <p className="text-xs text-foreground/80">
          <span className="font-semibold text-medical-glow/80">
            {t("interactions.field.mechanism")}:
          </span>{" "}
          {alert.mechanism}
        </p>
        <p className="mt-1 text-xs text-foreground/80">
          <span className="font-semibold text-medical-glow/80">
            {t("interactions.field.effect")}:
          </span>{" "}
          {alert.clinicalEffect}
        </p>
        <p className="mt-1 text-xs text-foreground/90">
          <span className="font-semibold text-medical-glow">
            → {t("interactions.field.recommendation")}:
          </span>{" "}
          {alert.recommendation}
        </p>
      </div>
    </GlowCard>
  );
}
