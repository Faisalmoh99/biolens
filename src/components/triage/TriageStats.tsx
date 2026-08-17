import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { TriageColor } from "@/types/patient";

const COLOR_STYLES: Record<TriageColor, { border: string; text: string; glow: string }> = {
  red: {
    border: "border-triage-red/50",
    text: "text-triage-red",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.35)]",
  },
  green: {
    border: "border-triage-green/50",
    text: "text-triage-green",
    glow: "shadow-[0_0_25px_rgba(34,197,94,0.3)]",
  },
};

export interface TriageStatsProps {
  counts: Record<TriageColor, number>;
  total: number;
}

const ORDER: TriageColor[] = ["red", "green"];

export function TriageStats({ counts, total }: TriageStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="absolute -top-4 right-1 hidden text-[11px] uppercase tracking-[0.25em] text-medical-cyan/60 sm:block">
        {t("triage.stats.total")}: {total}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ORDER.map((color) => (
          <StatCard
            key={color}
            color={color}
            value={counts[color] ?? 0}
            label={t(`triage.stats.${color}`)}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({
  color,
  value,
  label,
}: {
  color: TriageColor;
  value: number;
  label: string;
}) {
  const styles = COLOR_STYLES[color];
  const displayed = useAnimatedNumber(value);

  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setFlash(true);
      const id = window.setTimeout(() => setFlash(false), 300);
      return () => window.clearTimeout(id);
    }
  }, [value]);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 bg-medical-surface/70 px-4 py-4 backdrop-blur-sm",
        styles.border,
        styles.glow,
      )}
    >
      <AnimatePresence>
        {flash && (
          <motion.span
            key="flash"
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-medical-cyan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      <div
        className={cn(
          "relative text-[11px] font-semibold uppercase tracking-[0.2em]",
          styles.text,
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "relative mt-1 text-4xl font-bold tabular-nums sm:text-5xl",
          styles.text,
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayed}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {displayed}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        aria-hidden
        className={cn(
          "absolute right-3 top-3 inline-block h-2 w-2 rounded-full bg-current",
          styles.text,
          "animate-pulse-glow",
        )}
      />
    </motion.div>
  );
}

function useAnimatedNumber(target: number) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    if (val === target) return;
    const step = target > val ? 1 : -1;
    const id = window.setInterval(() => {
      setVal((curr) => {
        const next = curr + step;
        if ((step > 0 && next >= target) || (step < 0 && next <= target)) {
          window.clearInterval(id);
          return target;
        }
        return next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [target, val]);
  return val;
}
