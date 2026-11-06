import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart3,
  ClipboardList,
  Database,
  Globe,
  Home as HomeIcon,
  Loader2,
  Map as MapIcon,
  RotateCcw,
  Scan as ScanIcon,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PilgrimAvatar } from "@/components/patient/PilgrimAvatar";
import { useAppStore } from "@/store/appStore";
import { fetchAllPatients } from "@/lib/patients";
import type { Patient, TriageColor } from "@/types/patient";
import {
  buildPrecache,
  extendPrecache,
  loadStaticPrecache,
  clearPrecache,
  getCacheSource,
  hydrateStoresFromPrecache,
  isPrecacheFresh,
  loadPrecache,
  precacheEntryCount,
  setCacheSource,
} from "@/lib/precache";
import { cn } from "@/lib/utils";
import { DEMO_ONLY } from "@/lib/demo";

const TRIAGE_DOT: Record<TriageColor, string> = {
  red: "bg-triage-red",
  green: "bg-triage-green",
};

function formatAge(ms: number | null): string {
  if (ms === null) return "no cache";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s old`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m old`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h old`;
  return `${Math.floor(hr / 24)}d old`;
}

export function DirectorPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const directorMode = useAppStore((s) => s.directorMode);
  const toggleDirectorMode = useAppStore((s) => s.toggleDirectorMode);
  const setScanMode = useAppStore((s) => s.setScanMode);
  const scanMode = useAppStore((s) => s.scanMode);
  const setDemoTarget = useAppStore((s) => s.setDemoTargetPilgrimId);
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const language = useAppStore((s) => s.language);
  const showSpeakerNotes = useAppStore((s) => s.showSpeakerNotes);
  const setShowSpeakerNotes = useAppStore((s) => s.setShowSpeakerNotes);
  const geminiCallCount = useAppStore((s) => s.geminiCallCount);
  const resetGeminiCallCount = useAppStore((s) => s.resetGeminiCallCount);
  const clearTopFactsCache = useAppStore((s) => s.clearTopFactsCache);
  const clearTriageDecisions = useAppStore((s) => s.clearTriageDecisions);
  const clearSOAPCache = useAppStore((s) => s.clearSOAPCache);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [building, setBuilding] = useState(false);
  const [buildPct, setBuildPct] = useState(0);
  const [buildLabel, setBuildLabel] = useState("");
  const [precacheAgeMs, setPrecacheAgeMs] = useState<number | null>(null);
  const [precacheEntries, setPrecacheEntries] = useState(0);

  // Global hotkey: Cmd/Ctrl + Shift + D
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleDirectorMode();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleDirectorMode]);

  // Refresh precache stats whenever the panel opens
  useEffect(() => {
    if (!directorMode) return;
    const cached = loadPrecache();
    if (cached) {
      setPrecacheAgeMs(Date.now() - cached.timestamp);
      setPrecacheEntries(precacheEntryCount(cached));
    } else {
      setPrecacheAgeMs(null);
      setPrecacheEntries(0);
    }
  }, [directorMode]);

  // Lazy-load pilgrims when panel opens
  useEffect(() => {
    if (!directorMode || patients.length > 0) return;
    let cancelled = false;
    fetchAllPatients()
      .then((all) => {
        if (cancelled) return;
        setPatients(all);
      })
      .catch(() => {
        /* ignore — director panel is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [directorMode, patients.length]);

  const scenarioClick = useCallback(
    (p: Patient) => {
      setScanMode("demo");
      setDemoTarget(p.id);
      navigate("/scan");
    },
    [navigate, setDemoTarget, setScanMode],
  );

  const resetDemo = useCallback(() => {
    clearTopFactsCache();
    clearTriageDecisions();
    clearSOAPCache();
    resetGeminiCallCount();
    const cached = loadPrecache();
    if (cached) hydrateStoresFromPrecache(cached);
    navigate("/");
    toast.success("Demo reset", { description: "Cleared session, kept precache." });
  }, [
    clearSOAPCache,
    clearTopFactsCache,
    clearTriageDecisions,
    navigate,
    resetGeminiCallCount,
  ]);

  const runBuildPrecache = useCallback(async () => {
    if (building) return;
    setBuilding(true);
    setBuildPct(0);
    setBuildLabel("Starting…");
    try {
      const data = await buildPrecache((pct, label) => {
        setBuildPct(pct);
        setBuildLabel(label);
      });
      hydrateStoresFromPrecache(data);
      setCacheSource("memory");
      setPrecacheAgeMs(0);
      setPrecacheEntries(precacheEntryCount(data));
      toast.success("Precache complete", {
        description: `${precacheEntryCount(data)} entries cached for instant playback.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Precache failed", { description: msg });
    } finally {
      setBuilding(false);
    }
  }, [building]);

  // Dev-only: fill missing buckets (handoff, translations, 004/005
  // interactions) on top of the shipped static precache, keeping all
  // existing entries. Then use Export to replace public/data/ai-precache.json.
  const runFillGaps = useCallback(async () => {
    if (building) return;
    setBuilding(true);
    setBuildPct(0);
    setBuildLabel("Loading base precache…");
    try {
      // Resume from a partial v5 run in localStorage if present, else the shipped file.
      const local = loadPrecache();
      const base =
        local && (local.version as number) === 5
          ? local
          : await loadStaticPrecache([4, 5]);
      if (!base) throw new Error("No base precache found");
      const data = await extendPrecache(base, (pct, label) => {
        setBuildPct(pct);
        setBuildLabel(label);
      });
      hydrateStoresFromPrecache(data);
      setCacheSource("memory");
      setPrecacheAgeMs(0);
      setPrecacheEntries(precacheEntryCount(data));
      toast.success("Cache gaps filled", {
        description: `${precacheEntryCount(data)} entries cached. Export to save.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Fill gaps failed", { description: msg });
    } finally {
      setBuilding(false);
    }
  }, [building]);

  const toggleLanguage = useCallback(() => {
    const next = language === "ar" ? "en" : "ar";
    setLanguage(next);
    void i18n.changeLanguage(next);
  }, [i18n, language, setLanguage]);

  const clearPrecacheClick = useCallback(() => {
    clearPrecache();
    setCacheSource("none");
    setPrecacheAgeMs(null);
    setPrecacheEntries(0);
    toast.message("Precache cleared");
  }, []);

  const exportPrecache = useCallback(() => {
    const raw = localStorage.getItem("biolens-precache-v1");
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-precache.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t("director.precache.exported"));
  }, [t]);

  const source = getCacheSource();
  const precacheStatus = (() => {
    if (precacheEntries === 0 && source === "none") return "no cache";
    if (source === "static") {
      return `precache ${precacheEntries} · static`;
    }
    if (source === "memory") {
      const cached = loadPrecache();
      const fresh = cached ? isPrecacheFresh(cached) : false;
      return `precache ${precacheEntries} · ${formatAge(precacheAgeMs)} · ${fresh ? "cache" : "stale"}`;
    }
    return `precache ${precacheEntries} · ${formatAge(precacheAgeMs)}`;
  })();

  const statusBar = useMemo(
    () =>
      [
        `route ${location.pathname}`,
        `lang ${language.toUpperCase()}`,
        `scan ${scanMode}`,
        precacheStatus,
        `gemini ${geminiCallCount}`,
      ].join("  ·  "),
    [
      geminiCallCount,
      language,
      location.pathname,
      precacheStatus,
      scanMode,
    ],
  );

  return (
    <AnimatePresence>
      {directorMode && (
        <motion.div
          key="director-panel"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-[55] border-t border-medical-cyan/60 bg-medical-deep/95 text-foreground shadow-[0_-15px_60px_rgba(34,211,238,0.25)] backdrop-blur-md"
          role="region"
          aria-label="Director panel"
        >
          <div className="border-b border-medical-cyan/20 bg-medical-cyan/5 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-medical-glow/70">
            <span className="text-medical-glow">DIRECTOR</span>
            <span className="ms-2">{statusBar}</span>
            <button
              type="button"
              onClick={toggleDirectorMode}
              className="float-right text-[10px] text-medical-cyan/60 hover:text-medical-glow"
            >
              ⌘⇧D ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-[1.4fr_1fr]">
            {/* Scenarios */}
            <section>
              <SectionTitle>Scenarios</SectionTitle>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {patients.length === 0 && (
                  <div className="text-xs text-muted-foreground">Loading pilgrims…</div>
                )}
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => scenarioClick(p)}
                    className="group flex shrink-0 flex-col items-center gap-1 rounded-lg border border-medical-cyan/30 bg-medical-surface/40 p-2 text-[11px] transition-all hover:scale-105 hover:border-medical-cyan/70 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]"
                    style={{ width: 84 }}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-medical-cyan/30 group-hover:border-medical-cyan">
                      <PilgrimAvatar patient={p} size={36} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          TRIAGE_DOT[p.demoSeverity],
                        )}
                      />
                      <span className="max-w-[60px] truncate text-medical-glow/90">
                        {p.fullName.en.split(" ")[0]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="flex flex-col gap-2">
              <SectionTitle>Quick actions</SectionTitle>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <DirectorButton
                  icon={HomeIcon}
                  label="Home"
                  onClick={() => navigate("/home")}
                />
                <DirectorButton
                  icon={ScanIcon}
                  label="Scan"
                  onClick={() => navigate("/scan")}
                />
                <DirectorButton
                  icon={Users}
                  label="Triage"
                  onClick={() => navigate("/triage")}
                />
                <DirectorButton
                  icon={MapIcon}
                  label="Map View"
                  onClick={() => navigate("/map")}
                />
                <DirectorButton
                  icon={BarChart3}
                  label="Dashboard"
                  onClick={() => navigate("/dashboard")}
                />
                <DirectorButton
                  icon={RotateCcw}
                  label="Reset"
                  onClick={resetDemo}
                  tone="warning"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <DirectorButton
                  icon={ClipboardList}
                  label={showSpeakerNotes ? "Notes ✓" : "Notes"}
                  onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                  active={showSpeakerNotes}
                />
                <DirectorButton
                  icon={soundEnabled ? Volume2 : VolumeX}
                  label={soundEnabled ? "Sound" : "Muted"}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  active={soundEnabled}
                />
                <DirectorButton
                  icon={Globe}
                  label={`Lang · ${language.toUpperCase()}`}
                  onClick={toggleLanguage}
                />
                <DirectorButton
                  icon={Database}
                  label={precacheEntries > 0 ? "Clear cache" : "—"}
                  onClick={clearPrecacheClick}
                  disabled={precacheEntries === 0}
                />
              </div>

              {!DEMO_ONLY && (
              <div className="rounded-lg border border-medical-cyan/30 bg-medical-surface/40 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-medical-glow">
                    <Zap className="h-3.5 w-3.5" />
                    Build Precache
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={building || precacheEntries === 0}
                      onClick={exportPrecache}
                      variant="outline"
                      className="h-7 border-medical-cyan/40 text-medical-glow hover:bg-medical-cyan/10"
                    >
                      {t("director.precache.export")}
                    </Button>
                    <Button
                      size="sm"
                      disabled={building}
                      onClick={() => void runFillGaps()}
                      variant="outline"
                      className="h-7 border-medical-cyan/40 text-medical-glow hover:bg-medical-cyan/10"
                    >
                      Fill gaps
                    </Button>
                    <Button
                      size="sm"
                      disabled={building}
                      onClick={() => void runBuildPrecache()}
                      className="h-7 bg-medical-cyan text-medical-deep hover:bg-medical-glow"
                    >
                      {building ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Building…
                        </>
                      ) : (
                        "Run"
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Eats API quota — run once per rehearsal
                </div>
                {building && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-medical-cyan/10">
                      <div
                        className="h-full bg-medical-cyan transition-all"
                        style={{ width: `${Math.round(buildPct * 100)}%` }}
                      />
                    </div>
                    <div className="mt-1 truncate font-mono text-[10px] text-medical-glow/80">
                      {Math.round(buildPct * 100)}% · {buildLabel}
                    </div>
                  </div>
                )}
              </div>
              )}
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-medical-cyan/60">
      {children}
    </div>
  );
}

interface DirectorButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tone?: "default" | "warning";
}

function DirectorButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  tone = "default",
}: DirectorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
        tone === "warning"
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
          : active
            ? "border-medical-cyan/70 bg-medical-cyan/15 text-medical-glow shadow-[0_0_12px_rgba(34,211,238,0.4)]"
            : "border-medical-cyan/25 bg-medical-surface/40 text-medical-glow/80 hover:border-medical-cyan/55 hover:bg-medical-cyan/10 hover:text-medical-glow",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate">{label}</span>
    </button>
  );
}
