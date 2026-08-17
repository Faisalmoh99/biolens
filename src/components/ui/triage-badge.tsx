import { cn } from "@/lib/utils";
import type { TriageColor } from "@/types/patient";

const STYLES: Record<TriageColor, string> = {
  red: "bg-triage-red/20 text-triage-red border-triage-red/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  green:
    "bg-triage-green/20 text-triage-green border-triage-green/50 shadow-[0_0_15px_rgba(34,197,94,0.3)]",
};

export function TriageBadge({
  color,
  label,
  className,
}: {
  color: TriageColor;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider",
        STYLES[color],
        className,
      )}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse-glow" />
      {label || color}
    </span>
  );
}
