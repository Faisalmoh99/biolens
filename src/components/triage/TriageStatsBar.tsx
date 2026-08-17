import { motion } from "framer-motion";

import type { TriageColor } from "@/types/patient";

const COLOR_BG: Record<TriageColor, string> = {
  red: "bg-triage-red",
  green: "bg-triage-green",
};

export interface TriageStatsBarProps {
  counts: Record<TriageColor, number>;
  total: number;
}

const ORDER: TriageColor[] = ["red", "green"];

export function TriageStatsBar({ counts, total }: TriageStatsBarProps) {
  const safeTotal = Math.max(total, 1);
  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full border border-medical-cyan/15 bg-medical-deep/60"
      aria-hidden
    >
      {ORDER.map((color) => {
        const pct = ((counts[color] ?? 0) / safeTotal) * 100;
        if (pct === 0) return null;
        return (
          <motion.span
            key={color}
            className={COLOR_BG[color]}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </div>
  );
}
