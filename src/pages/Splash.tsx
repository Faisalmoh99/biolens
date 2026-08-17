import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useAppStore } from "@/store/appStore";

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

function ParticleField() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 12 + Math.random() * 14,
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

function BigIrisLogo() {
  return (
    <div className="relative flex h-[300px] w-[300px] items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 22, ease: "linear", repeat: Infinity }}
        className="absolute inset-0"
      >
        <svg viewBox="0 0 300 300" className="h-full w-full">
          <circle
            cx="150"
            cy="150"
            r="146"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="0.8"
            strokeDasharray="6 8"
            opacity="0.55"
          />
          <circle
            cx="150"
            cy="150"
            r="146"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeDasharray="1 250"
            opacity="0.9"
          />
        </svg>
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
        className="absolute inset-8"
      >
        <svg viewBox="0 0 260 260" className="h-full w-full">
          <circle
            cx="130"
            cy="130"
            r="126"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="0.6"
            strokeDasharray="2 6"
            opacity="0.45"
          />
        </svg>
      </motion.div>

      <motion.svg
        viewBox="0 0 240 240"
        className="relative h-[220px] w-[220px]"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <defs>
          <radialGradient id="splash-iris-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a1428" />
            <stop offset="35%" stopColor="#0e7490" />
            <stop offset="70%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#cffafe" />
          </radialGradient>
          <radialGradient id="splash-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="118" fill="url(#splash-glow)" />
        <circle
          cx="120"
          cy="120"
          r="88"
          fill="url(#splash-iris-gradient)"
          stroke="#22d3ee"
          strokeWidth="1.2"
        />
        {Array.from({ length: 48 }).map((_, i) => (
          <line
            key={i}
            x1="120"
            y1="120"
            x2="120"
            y2="38"
            stroke="#67e8f9"
            strokeWidth="0.6"
            strokeOpacity="0.45"
            transform={`rotate(${i * 7.5} 120 120)`}
          />
        ))}
        <motion.g
          style={{ transformOrigin: "120px 120px", transformBox: "fill-box" }}
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle
            cx="120"
            cy="120"
            r="32"
            fill="#020617"
            stroke="#22d3ee"
            strokeWidth="1.2"
          />
          <motion.circle
            cx="120"
            cy="120"
            r="8"
            fill="#22d3ee"
            animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.25, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>
        <circle cx="108" cy="108" r="5" fill="white" opacity="0.7" />
      </motion.svg>
    </div>
  );
}

function playBootSweep(enabled: boolean) {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 1.5);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.6);
    osc.onended = () => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    };
  } catch {
    /* audio not available */
  }
}

export default function Splash() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const [showCta, setShowCta] = useState(false);
  const [exiting, setExiting] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!playedRef.current) {
      playedRef.current = true;
      playBootSweep(soundEnabled);
    }
    const timer = window.setTimeout(() => setShowCta(true), 2500);
    return () => window.clearTimeout(timer);
  }, [soundEnabled]);

  const title = t("app.title");
  const tagline = t("splash.tagline");

  const handleBegin = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => navigate("/home"), 1500);
  }, [exiting, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        if (showCta) handleBegin();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleBegin, showCta]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#020617] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(34, 211, 238, 0.15) 0%, transparent 60%)",
        }}
      />
      <ParticleField />

      <AnimatePresence>
        {exiting && (
          <motion.div
            key="exit-darken"
            className="pointer-events-none absolute inset-0 z-30 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        )}
        {exiting && (
          <motion.div
            key="exit-sweep"
            className="pointer-events-none absolute inset-x-0 top-1/2 z-40 h-[3px] bg-medical-glow"
            style={{ boxShadow: "0 0 40px rgba(34,211,238,0.95)" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, ease: "easeInOut", times: [0, 0.3, 0.7, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        animate={
          exiting
            ? { opacity: 0, scale: 1.15, filter: "blur(10px)" }
            : { opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <BigIrisLogo />

        <motion.h1
          dir="ltr"
          className="mt-8 flex bg-gradient-to-b from-cyan-200 via-white to-cyan-300 bg-clip-text text-6xl font-bold tracking-[0.18em] text-transparent sm:text-7xl"
          aria-label={title}
        >
          {Array.from(title).map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.6 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.6 + title.length * 0.1 + 0.2,
          }}
          className="mt-5 text-center text-lg uppercase tracking-[0.45em] text-medical-cyan/80 sm:text-xl"
        >
          {tagline}
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {showCta && !exiting && (
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mt-16 flex flex-col items-center gap-4"
          >
            <button
              type="button"
              onClick={handleBegin}
              className="group relative overflow-hidden rounded-full border border-medical-cyan/60 bg-medical-cyan/10 px-14 py-4 text-lg font-semibold uppercase tracking-[0.35em] text-medical-glow shadow-[0_0_45px_rgba(34,211,238,0.55)] transition-all duration-300 hover:bg-medical-cyan/20 hover:shadow-[0_0_70px_rgba(34,211,238,0.85)]"
            >
              <span className="relative z-10">{t("splash.begin")}</span>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-medical-glow/40 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: ["-100%", "300%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              />
            </button>

            <motion.div
              animate={{ y: [0, 6, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.4em] text-medical-glow/70"
            >
              <ChevronDown className="h-3 w-3" />
              {t("splash.hint")}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
