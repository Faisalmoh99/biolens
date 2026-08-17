import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Activity, Globe, Scan, Stethoscope, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { TriageBadge } from "@/components/ui/triage-badge";
import { PageTransition } from "@/components/layout/PageTransition";
import { playSoftClick } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import type { TriageColor } from "@/types/patient";

function IrisIllustration() {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      {/* Outer rotating ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, ease: "linear", repeat: Infinity }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 256 256" className="h-full w-full">
          <circle
            cx="128"
            cy="128"
            r="124"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="0.75"
            strokeDasharray="6 8"
            opacity="0.5"
          />
          <circle
            cx="128"
            cy="128"
            r="124"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="1 220"
            opacity="0.9"
          />
        </svg>
      </motion.div>

      {/* Inner counter-rotating ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
        className="absolute inset-6"
      >
        <svg viewBox="0 0 220 220" className="h-full w-full">
          <circle
            cx="110"
            cy="110"
            r="106"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.5"
            strokeDasharray="2 6"
            opacity="0.4"
          />
        </svg>
      </motion.div>

      {/* Iris */}
      <motion.svg
        viewBox="0 0 200 200"
        className="relative h-48 w-48"
        style={{ originX: "100px", originY: "100px" }}
      >
        <defs>
          <radialGradient id="iris-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="35%" stopColor="#0e7490" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#cffafe" />
          </radialGradient>
          <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#glow-gradient)" />
        <circle
          cx="100"
          cy="100"
          r="72"
          fill="url(#iris-gradient)"
          stroke="#22d3ee"
          strokeWidth="1"
        />
        {Array.from({ length: 36 }).map((_, i) => (
          <line
            key={i}
            x1="100"
            y1="100"
            x2="100"
            y2="32"
            stroke="#67e8f9"
            strokeWidth="0.6"
            strokeOpacity="0.45"
            transform={`rotate(${i * 10} 100 100)`}
          />
        ))}
        {/* Pupil — organic scale 0.95↔1.05 */}
        <motion.g
          style={{ transformOrigin: "100px 100px", transformBox: "fill-box" }}
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle
            cx="100"
            cy="100"
            r="26"
            fill="#020617"
            stroke="#22d3ee"
            strokeWidth="1"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="6"
            fill="#22d3ee"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
        <circle cx="92" cy="92" r="4" fill="white" opacity="0.7" />
      </motion.svg>
    </div>
  );
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

function Particles() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 12,
        size: 1 + Math.random() * 2,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-medical-glow"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 6px rgba(34, 211, 238, 0.8)",
          }}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "-10%", opacity: [0, 0.8, 0.8, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

interface HelixDot {
  id: number;
  x: number;
  delay: number;
  size: number;
}

function HelixParticles() {
  const dots = useMemo<HelixDot[]>(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 8,
        size: 1.5 + Math.random() * 1.5,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-medical-cyan"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 4px rgba(34, 211, 238, 0.6)",
          }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{
            y: ["100%", "-10%"],
            x: [0, 8, -8, 8, -8, 0],
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 8,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            y: { duration: 8, ease: "linear", repeat: Infinity, delay: p.delay },
            x: {
              duration: 8,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            },
            opacity: {
              duration: 8,
              repeat: Infinity,
              delay: p.delay,
              times: [0, 0.15, 0.85, 1],
            },
          }}
        />
      ))}
    </div>
  );
}

interface Stat {
  icon: typeof Stethoscope;
  value: string;
  labelKey: string;
}

const STATS: Stat[] = [
  { icon: Stethoscope, value: "147,000+", labelKey: "home.stats.services" },
  { icon: Globe, value: "180", labelKey: "home.stats.countries" },
  { icon: Zap, value: "< 3s", labelKey: "home.stats.identification" },
];

const TRIAGE_COLORS: TriageColor[] = ["red", "green"];

function parseStatNumber(value: string): { number: number; prefix: string; suffix: string } | null {
  // Extract first integer; preserve characters before/after as prefix/suffix.
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  if (!match) return null;
  const [, prefix, rawDigits, suffix] = match;
  const number = parseInt(rawDigits.replace(/,/g, ""), 10);
  if (Number.isNaN(number)) return null;
  return { number, prefix, suffix };
}

function AnimatedStatValue({ value }: { value: string }) {
  const parsed = parseStatNumber(value);
  const mv = useMotionValue(0);

  const target = parsed?.number ?? 0;
  const formatted = useTransform(mv, (n) =>
    Math.round(n).toLocaleString(),
  );

  useEffect(() => {
    if (!parsed) return;
    mv.set(0);
    const controls = animate(mv, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [parsed, target, mv]);

  if (!parsed) {
    return <span>{value}</span>;
  }
  return (
    <span className="inline-flex items-baseline">
      {parsed.prefix && <span>{parsed.prefix}</span>}
      <motion.span>{formatted}</motion.span>
      {parsed.suffix && <span>{parsed.suffix}</span>}
    </span>
  );
}

function StatCard({ stat, label }: { stat: Stat; label: string }) {
  const Icon = stat.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <GlowCard
      className={cn(
        "relative overflow-hidden px-6 py-7 text-left",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BorderSweep active={hovered} />
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-medical-cyan/30 bg-medical-cyan/10 p-2">
          <Icon className="h-5 w-5 text-medical-glow" />
        </div>
        <Activity className="ms-auto h-3.5 w-3.5 text-medical-cyan/40" />
      </div>
      <div className="mt-4 text-4xl font-bold text-medical-glow tabular-nums">
        <AnimatedStatValue value={stat.value} />
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </GlowCard>
  );
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

function RippleScanCTA({ label }: { label: string }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    playSoftClick();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((rs) => rs.filter((r) => r.id !== id));
    }, 700);
  }

  return (
    <Button
      asChild
      size="lg"
      className="relative h-12 gap-2 overflow-hidden bg-medical-cyan px-8 text-base font-semibold text-medical-deep shadow-[0_0_30px_rgba(34,211,238,0.45)] transition-shadow duration-200 hover:bg-medical-glow hover:shadow-[0_0_60px_rgba(34,211,238,0.85)]"
    >
      <Link to="/scan" onClick={handleClick} className="relative">
        <Scan className="h-5 w-5" />
        {label}
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full bg-medical-glow"
            style={{
              left: r.x,
              top: r.y,
              width: 8,
              height: 8,
              translateX: "-50%",
              translateY: "-50%",
            }}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 30, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </Link>
    </Button>
  );
}

function BorderSweep({ active }: { active: boolean }) {
  if (!active) return null;
  // Inner stroked rect that draws around the card border once.
  // strokeDasharray + strokeDashoffset reveal animation traces the perimeter.
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
    >
      <motion.rect
        x="1"
        y="1"
        width="99%"
        height="99%"
        rx={10}
        ry={10}
        fill="none"
        stroke="#22d3ee"
        strokeWidth={1.5}
        pathLength={1}
        strokeDasharray="0.25 0.75"
        vectorEffect="non-scaling-stroke"
        initial={{ strokeDashoffset: 1, opacity: 0 }}
        animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, ease: "linear" }}
      />
    </svg>
  );
}

export default function Home() {
  const { t } = useTranslation();

  return (
    <PageTransition>
      <div className="relative min-h-full overflow-hidden">
        <Particles />
        <HelixParticles />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 py-12 text-center md:py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <IrisIllustration />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 bg-gradient-to-b from-cyan-300 via-white to-cyan-300 bg-clip-text text-5xl font-bold tracking-wide text-transparent sm:text-6xl md:text-7xl"
          >
            {t("app.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-2 text-base uppercase tracking-[0.4em] text-medical-cyan/70"
          >
            {t("home.headline")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            {t("home.tagline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <RippleScanCTA label={t("home.cta.scan")} />
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 gap-2 border-medical-cyan/40 bg-transparent px-8 text-base font-semibold text-medical-glow hover:border-medical-cyan hover:bg-medical-cyan/10 hover:text-medical-glow"
            >
              <Link to="/triage" onClick={() => playSoftClick()}>
                <Users className="h-5 w-5" />
                {t("home.cta.triage")}
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {STATS.map((stat) => (
              <StatCard key={stat.labelKey} stat={stat} label={t(stat.labelKey)} />
            ))}
          </motion.div>

          {/* Triage badge swatches (acceptance criterion #6) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            {TRIAGE_COLORS.map((c) => (
              <TriageBadge key={c} color={c} />
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
