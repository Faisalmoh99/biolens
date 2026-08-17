import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

interface ConfidenceCounterProps {
  target: number; // 0..1
  duration?: number; // ms
  className?: string;
}

export function ConfidenceCounter({
  target,
  duration = 1200,
  className,
}: ConfidenceCounterProps) {
  const value = useMotionValue(0);
  const formatted = useTransform(value, (v) => `${(v * 100).toFixed(1)}%`);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    setArrived(false);
    const controls = animate(value, target, {
      duration: duration / 1000,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => setArrived(true),
    });
    return () => controls.stop();
  }, [target, duration, value]);

  return (
    <motion.span
      className={className}
      animate={
        arrived
          ? {
              scale: [1, 1.05, 1],
              textShadow: [
                "0 0 0px rgba(34,211,238,0)",
                "0 0 24px rgba(34,211,238,0.8)",
                "0 0 12px rgba(34,211,238,0.4)",
              ],
            }
          : { scale: 1 }
      }
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ display: "inline-block" }}
    >
      <motion.span>{formatted}</motion.span>
    </motion.span>
  );
}
