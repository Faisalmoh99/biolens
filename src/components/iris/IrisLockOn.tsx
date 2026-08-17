import { motion } from "framer-motion";

interface IrisLockOnProps {
  centerX: number;
  centerY: number;
  active: boolean;
}

const RINGS = [0, 0.2, 0.4];

export function IrisLockOn({ centerX, centerY, active }: IrisLockOnProps) {
  if (!active) return null;

  const cxPct = `${centerX * 100}%`;
  const cyPct = `${centerY * 100}%`;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      {RINGS.map((delay) => (
        <motion.circle
          key={delay}
          cx={cxPct}
          cy={cyPct}
          r={18}
          fill="none"
          stroke="#22d3ee"
          strokeWidth={1.6}
          style={{
            filter: "drop-shadow(0 0 6px rgba(34,211,238,0.85))",
            transformOrigin: `${centerX * 100}% ${centerY * 100}%`,
          }}
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 1.2,
            delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </svg>
  );
}
