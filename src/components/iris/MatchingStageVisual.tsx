import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

import { fetchAllPatients } from "@/lib/patients";
import { cn } from "@/lib/utils";
import { PilgrimAvatar } from "@/components/patient/PilgrimAvatar";
import type { Patient } from "@/types/patient";

type Stage = "capturing" | "extracting" | "matching";

interface MatchingStageVisualProps {
  stage: Stage;
  matchedPilgrimId?: string | null;
  className?: string;
}

export function MatchingStageVisual({
  stage,
  matchedPilgrimId,
  className,
}: MatchingStageVisualProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-md border border-medical-cyan/20 bg-medical-deep/40 p-3",
        className,
      )}
    >
      <div className="relative h-[80px] w-[200px] overflow-hidden">
        {stage === "capturing" && <ShutterVisual />}
        {stage === "extracting" && <NeuralNetVisual />}
        {stage === "matching" && (
          <MatchingAvatarsVisual matchedPilgrimId={matchedPilgrimId} />
        )}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-medical-cyan/80">
        {t(`scan.visual.${stage}`)}
      </div>
    </div>
  );
}

function ShutterVisual() {
  const wedgeStyle = { fill: "#020617" };
  return (
    <svg
      viewBox="0 0 200 80"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* L-bracket corners */}
      <g
        stroke="#22d3ee"
        strokeWidth="1.5"
        fill="none"
        opacity="0.85"
        strokeLinecap="round"
      >
        <path d="M10 16 V8 H18" />
        <path d="M182 8 H190 V16" />
        <path d="M10 64 V72 H18" />
        <path d="M182 72 H190 V64" />
      </g>
      {/* Crosshair */}
      <g stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1">
        <line x1="100" y1="20" x2="100" y2="60" />
        <line x1="80" y1="40" x2="120" y2="40" />
        <circle cx="100" cy="40" r="8" fill="none" />
      </g>

      {/* Four wedges sliding in then back out */}
      <motion.polygon
        points="0,0 100,40 0,80"
        style={wedgeStyle}
        initial={{ x: -100 }}
        animate={{ x: [-100, 0, -100] }}
        transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.polygon
        points="200,0 100,40 200,80"
        style={wedgeStyle}
        initial={{ x: 100 }}
        animate={{ x: [100, 0, 100] }}
        transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.polygon
        points="0,0 200,0 100,40"
        style={wedgeStyle}
        initial={{ y: -80 }}
        animate={{ y: [-80, 0, -80] }}
        transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.polygon
        points="0,80 200,80 100,40"
        style={wedgeStyle}
        initial={{ y: 80 }}
        animate={{ y: [80, 0, 80] }}
        transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity }}
      />
    </svg>
  );
}

function NeuralNetVisual() {
  const leftDots = useMemo(
    () => Array.from({ length: 6 }).map((_, i) => ({ x: 20, y: 8 + i * 13 })),
    [],
  );
  const midDots = useMemo(
    () => Array.from({ length: 4 }).map((_, i) => ({ x: 100, y: 14 + i * 18 })),
    [],
  );
  const right = { x: 180, y: 40 };

  const lines = useMemo(() => {
    const arr: { from: { x: number; y: number }; to: { x: number; y: number }; key: string }[] =
      [];
    for (const l of leftDots)
      for (const m of midDots)
        arr.push({ from: l, to: m, key: `l${l.y}-m${m.y}` });
    for (const m of midDots) arr.push({ from: m, to: right, key: `m${m.y}-r` });
    return arr;
  }, [leftDots, midDots]);

  const [highlights, setHighlights] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Set<string>();
      const keys = lines.map((l) => l.key);
      for (let i = 0; i < 3; i++) {
        next.add(keys[Math.floor(Math.random() * keys.length)]);
      }
      setHighlights(next);
    }, 100);
    return () => window.clearInterval(id);
  }, [lines]);

  return (
    <svg
      viewBox="0 0 200 80"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="nn-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {lines.map((l) => {
        const isHot = highlights.has(l.key);
        return (
          <motion.line
            key={l.key}
            x1={l.from.x}
            y1={l.from.y}
            x2={l.to.x}
            y2={l.to.y}
            stroke={isHot ? "#ffffff" : "url(#nn-line)"}
            strokeWidth={isHot ? 1.5 : 0.8}
            strokeOpacity={isHot ? 1 : 0.55}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
      {[...leftDots, ...midDots, right].map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={2.4}
          fill="#22d3ee"
          style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.9))" }}
        />
      ))}
    </svg>
  );
}

interface MatchingAvatarsVisualProps {
  matchedPilgrimId?: string | null;
}

function MatchingAvatarsVisual({ matchedPilgrimId }: MatchingAvatarsVisualProps) {
  const [pilgrims, setPilgrims] = useState<Patient[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllPatients()
      .then((all) => {
        if (cancelled) return;
        setPilgrims(all.slice(0, 5));
      })
      .catch(() => {
        // best-effort visualization — leave empty
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center gap-3 px-3">
      {/* Scan bar */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-0 h-full w-[2px] bg-medical-cyan"
        style={{
          boxShadow: "0 0 12px rgba(34,211,238,0.85)",
        }}
        initial={{ left: "0%" }}
        animate={{ left: ["0%", "100%"] }}
        transition={{ duration: 0.8, repeat: 1, ease: "easeInOut" }}
      />

      {pilgrims.map((p) => {
        const isMatch = !!matchedPilgrimId && matchedPilgrimId === p.id;
        return (
          <motion.div
            key={p.id}
            initial={{ scale: 1 }}
            animate={isMatch ? { scale: 1.15 } : { scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "relative h-10 w-10 overflow-hidden rounded-full border",
              isMatch
                ? "border-medical-cyan shadow-[0_0_18px_rgba(34,211,238,0.9)]"
                : "border-medical-cyan/30",
            )}
          >
            <PilgrimAvatar patient={p} size={38} />
            <div className="absolute inset-0 bg-medical-deep/30" />
          </motion.div>
        );
      })}
    </div>
  );
}
