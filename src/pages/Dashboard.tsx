import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Flag,
  Globe2,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

import { PageTransition } from "@/components/layout/PageTransition";
import { GlowCard } from "@/components/ui/glow-card";
import { fetchAllPatients } from "@/lib/patients";
import { useAppStore } from "@/store/appStore";
import type { Patient, TriageColor } from "@/types/patient";
import { cn } from "@/lib/utils";

const TRIAGE_ORDER: TriageColor[] = ["red", "green"];

const TRIAGE_STYLES: Record<
  TriageColor,
  { border: string; text: string; glow: string; bar: string }
> = {
  red: {
    border: "border-triage-red/50",
    text: "text-triage-red",
    glow: "shadow-[0_0_22px_rgba(239,68,68,0.3)]",
    bar: "bg-triage-red",
  },
  green: {
    border: "border-triage-green/50",
    text: "text-triage-green",
    glow: "shadow-[0_0_22px_rgba(34,197,94,0.3)]",
    bar: "bg-triage-green",
  },
};

const NATIONALITY_FLAG: Record<string, string> = {
  Indonesia: "🇮🇩",
  Pakistan: "🇵🇰",
  "Türkiye": "🇹🇷",
  Turkey: "🇹🇷",
  Nigeria: "🇳🇬",
  Egypt: "🇪🇬",
};

function flagFor(country: string): string {
  return NATIONALITY_FLAG[country] ?? "🏳️";
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min} min ${sec.toString().padStart(2, "0")} sec`;
}

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  format?: (v: number) => string;
  className?: string;
}

function AnimatedNumber({
  target,
  duration = 1000,
  format = (v) => Math.round(v).toString(),
  className,
}: AnimatedNumberProps) {
  const value = useMotionValue(0);
  const display = useTransform(value, format);

  useEffect(() => {
    const controls = animate(value, target, {
      duration: duration / 1000,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [target, duration, value]);

  return (
    <motion.span className={className} style={{ display: "inline-block" }}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

function WidgetTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-medical-cyan/70">
      <Icon className="h-3.5 w-3.5 text-medical-cyan" />
      <span>{children}</span>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const sessionStartTime = useAppStore((s) => s.sessionStartTime);
  const geminiCallCount = useAppStore((s) => s.geminiCallCount);
  const matchHistory = useAppStore((s) => s.matchHistory);
  const triageDecisions = useAppStore((s) => s.triageDecisions);

  useEffect(() => {
    let cancelled = false;
    fetchAllPatients()
      .then((all) => {
        if (!cancelled) setPatients(all);
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const totalCases = patients.length;

  const severityCounts = useMemo(() => {
    const counts: Record<TriageColor, number> = {
      red: 0,
      green: 0,
    };
    for (const p of patients) counts[p.demoSeverity] += 1;
    return counts;
  }, [patients]);

  const nationalityRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of patients) {
      const key = p.nationality.en;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const rows = Array.from(map.entries()).map(([country, count]) => ({
      country,
      count,
    }));
    rows.sort((a, b) => b.count - a.count);
    const max = rows.reduce((acc, r) => Math.max(acc, r.count), 0);
    return { rows, max };
  }, [patients]);

  const complaints = useMemo(() => {
    return patients.map((p) => ({
      id: p.id,
      name: p.fullName.en.split(" ")[0],
      summary: p.demoPresentingComplaint.en
        .split(/\s+/)
        .slice(0, 4)
        .join(" "),
      severity: p.demoSeverity,
    }));
  }, [patients]);

  const avgMatchPct = useMemo(() => {
    if (matchHistory.length === 0) return null;
    const last = matchHistory.slice(-10);
    const total = last.reduce((acc, m) => acc + m.similarity, 0);
    return (total / last.length) * 100;
  }, [matchHistory]);

  const avgTriagePct = useMemo(() => {
    const values = Object.values(triageDecisions).map((d) => d.confidence);
    if (values.length === 0) return null;
    const total = values.reduce((acc, v) => acc + v, 0);
    return (total / values.length) * 100;
  }, [triageDecisions]);

  const elapsed = formatElapsed(now - sessionStartTime);

  return (
    <PageTransition>
      <div className="container mx-auto max-w-7xl p-6">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-medical-cyan">
              {t("dashboard.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono uppercase tracking-[0.25em] text-medical-glow">
              {t("dashboard.live")}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Widget 1: Total Active Cases */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Users}>{t("dashboard.widget.total")}</WidgetTitle>
            <div className="text-7xl font-bold tabular-nums text-medical-cyan drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
              <AnimatedNumber target={totalCases} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {t("dashboard.widget.total")}
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-xs text-medical-glow/80">
              <Activity className="h-3.5 w-3.5 text-medical-cyan" />
              <span>
                {t("dashboard.widget.activeFor", { time: elapsed })}
              </span>
            </div>
          </GlowCard>

          {/* Widget 2: By Severity */}
          <GlowCard className="p-5">
            <WidgetTitle icon={AlertTriangle}>
              {t("dashboard.widget.bySeverity")}
            </WidgetTitle>
            <div className="grid grid-cols-2 gap-3">
              {TRIAGE_ORDER.map((color) => {
                const styles = TRIAGE_STYLES[color];
                return (
                  <div
                    key={color}
                    className={cn(
                      "relative overflow-hidden rounded-lg border-2 bg-medical-surface/60 px-4 py-4 backdrop-blur-sm",
                      styles.border,
                      styles.glow,
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-y-0 left-0 w-1",
                        styles.bar,
                      )}
                    />
                    <div
                      className={cn(
                        "ms-1 text-[11px] font-semibold uppercase tracking-[0.22em]",
                        styles.text,
                      )}
                    >
                      {t(`triage.stats.${color}`)}
                    </div>
                    <div
                      className={cn(
                        "ms-1 text-5xl font-bold tabular-nums",
                        styles.text,
                      )}
                    >
                      <AnimatedNumber target={severityCounts[color]} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlowCard>

          {/* Widget 3: By Nationality */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Globe2}>
              {t("dashboard.widget.byNationality")}
            </WidgetTitle>
            <div className="flex flex-col gap-2.5">
              {nationalityRows.rows.map(({ country, count }) => {
                const pct =
                  nationalityRows.max === 0
                    ? 0
                    : (count / nationalityRows.max) * 100;
                return (
                  <div key={country} className="flex items-center gap-3">
                    <span className="w-6 text-base leading-none">
                      {flagFor(country)}
                    </span>
                    <span className="w-20 truncate text-xs text-medical-glow/90">
                      {country}
                    </span>
                    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-medical-cyan/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.9,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="h-full rounded-full bg-medical-cyan shadow-[0_0_10px_rgba(34,211,238,0.6)]"
                      />
                    </div>
                    <span className="w-6 text-right font-mono text-xs tabular-nums text-medical-glow">
                      {count}
                    </span>
                  </div>
                );
              })}
              {nationalityRows.rows.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.empty")}
                </div>
              )}
            </div>
          </GlowCard>

          {/* Widget 4: Top Chief Complaints */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Stethoscope}>
              {t("dashboard.widget.complaints")}
            </WidgetTitle>
            <ul className="flex flex-col gap-2 text-sm">
              {complaints.map((c) => {
                const styles = TRIAGE_STYLES[c.severity];
                return (
                  <li key={c.id} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block h-2 w-2 shrink-0 rounded-full",
                        styles.bar,
                      )}
                    />
                    <span className="text-medical-glow/90">{c.summary}</span>
                    <span className="ms-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {c.name}
                    </span>
                  </li>
                );
              })}
              {complaints.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  {t("dashboard.empty")}
                </li>
              )}
            </ul>
          </GlowCard>

          {/* Widget 5: AI Calls This Session */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Sparkles}>
              {t("dashboard.widget.aiCalls")}
            </WidgetTitle>
            <div className="text-7xl font-bold tabular-nums text-medical-cyan drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
              <AnimatedNumber target={geminiCallCount} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {t("dashboard.widget.aiCalls")}
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-medical-glow/60">
              {t("dashboard.widget.aiCalls.latency")}
            </div>
          </GlowCard>

          {/* Widget 6: Avg Match Confidence */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Flag}>
              {t("dashboard.widget.avgMatch")}
            </WidgetTitle>
            {avgMatchPct === null ? (
              <>
                <div className="text-7xl font-bold tabular-nums text-medical-cyan/60">
                  {t("dashboard.empty")}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t("dashboard.empty.matches")}
                </div>
              </>
            ) : (
              <>
                <div className="text-7xl font-bold tabular-nums text-medical-cyan drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
                  <AnimatedNumber
                    target={avgMatchPct}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t("dashboard.widget.avgMatch")}
                </div>
              </>
            )}
          </GlowCard>

          {/* Widget 7: Avg AI Triage Confidence */}
          <GlowCard className="p-5">
            <WidgetTitle icon={Sparkles}>
              {t("dashboard.widget.avgTriage")}
            </WidgetTitle>
            {avgTriagePct === null ? (
              <>
                <div className="text-7xl font-bold tabular-nums text-medical-cyan/60">
                  {t("dashboard.empty")}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t("dashboard.widget.avgTriage")}
                </div>
              </>
            ) : (
              <>
                <div className="text-7xl font-bold tabular-nums text-medical-cyan drop-shadow-[0_0_18px_rgba(34,211,238,0.55)]">
                  <AnimatedNumber
                    target={avgTriagePct}
                    format={(v) => `${v.toFixed(1)}%`}
                  />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {t("dashboard.widget.avgTriage")}
                </div>
              </>
            )}
          </GlowCard>
        </div>
      </div>
    </PageTransition>
  );
}
