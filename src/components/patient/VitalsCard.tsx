import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUp, Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/patient/SectionCard";
import type { Patient } from "@/types/patient";

type Direction = "up" | "down" | "ok";

interface VitalRow {
  key: string;
  label: string;
  // For single-number vitals: numeric target value, suffix appended to display
  // For BP, we pass a custom value and skip numeric animation
  value: number | { primary: number; secondary: number };
  suffix?: string;
  direction: Direction;
  critical: boolean;
  decimals?: number;
}

const AVPU_STYLE: Record<
  Patient["demoVitals"]["consciousness"],
  { label: string; cls: string }
> = {
  alert: { label: "A", cls: "text-triage-green" },
  verbal: { label: "V", cls: "text-yellow-300" },
  pain: { label: "P", cls: "text-triage-orange" },
  unresponsive: { label: "U", cls: "text-triage-red" },
};

function checkRange(
  value: number,
  low: number,
  high: number,
): { direction: Direction; critical: boolean } {
  if (value < low) return { direction: "down", critical: true };
  if (value > high) return { direction: "up", critical: true };
  return { direction: "ok", critical: false };
}

export function VitalsCard({ patient }: { patient: Patient }) {
  const { t } = useTranslation();
  const v = patient.demoVitals;

  const hr = checkRange(v.heartRate, 60, 100);
  const rr = checkRange(v.respRate, 12, 20);
  const sbp = checkRange(v.systolicBP, 90, 140);
  const dbp = checkRange(v.diastolicBP, 60, 90);
  const bpCrit = sbp.critical || dbp.critical;
  const bpDir: Direction =
    sbp.direction === "ok" && dbp.direction === "ok"
      ? "ok"
      : v.systolicBP < 90 || v.diastolicBP < 60
        ? "down"
        : "up";
  const spo2: { direction: Direction; critical: boolean } =
    v.spo2 < 95 ? { direction: "down", critical: true } : { direction: "ok", critical: false };
  const temp = checkRange(v.temperatureC, 36.1, 37.2);
  const glu = checkRange(v.glucoseMgDl, 70, 140);

  const rows: VitalRow[] = [
    {
      key: "hr",
      label: t("profile.vitals.hr"),
      value: v.heartRate,
      ...hr,
    },
    {
      key: "rr",
      label: t("profile.vitals.rr"),
      value: v.respRate,
      ...rr,
    },
    {
      key: "bp",
      label: t("profile.vitals.bp"),
      value: { primary: v.systolicBP, secondary: v.diastolicBP },
      direction: bpDir,
      critical: bpCrit,
    },
    {
      key: "spo2",
      label: t("profile.vitals.spo2"),
      value: v.spo2,
      suffix: "%",
      ...spo2,
    },
    {
      key: "temp",
      label: t("profile.vitals.temp"),
      value: v.temperatureC,
      suffix: "°C",
      decimals: 1,
      ...temp,
    },
    {
      key: "glucose",
      label: t("profile.vitals.glucose"),
      value: v.glucoseMgDl,
      ...glu,
    },
  ];

  const avpu = AVPU_STYLE[v.consciousness];

  return (
    <SectionCard title={t("profile.section.vitals")} icon={<Heart className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <VitalCell key={row.key} row={row} />
        ))}
        <div className="col-span-2 flex items-center justify-between rounded-lg border border-white/5 bg-medical-deep/40 px-3 py-2 sm:col-span-3">
          <span className="text-xs uppercase tracking-wider text-foreground/60">
            {t("profile.vitals.avpu")}
          </span>
          <span className={cn("text-2xl font-bold tabular-nums", avpu.cls)}>
            {avpu.label}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}

function VitalCell({ row }: { row: VitalRow }) {
  const Arrow =
    row.direction === "down"
      ? ArrowDown
      : row.direction === "up"
        ? ArrowUp
        : null;
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-white/5 bg-medical-deep/40 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wider text-foreground/60">
        {row.label}
      </span>
      <span
        className={cn(
          "flex items-center gap-1 text-xl font-bold tabular-nums",
          row.critical ? "text-triage-red" : "text-foreground",
        )}
      >
        {typeof row.value === "number" ? (
          <AnimatedNumber
            target={row.value}
            decimals={row.decimals ?? 0}
            suffix={row.suffix}
          />
        ) : (
          <BPNumber
            systolic={row.value.primary}
            diastolic={row.value.secondary}
          />
        )}
        {Arrow && (
          <motion.span
            aria-hidden
            className="inline-flex"
            animate={
              row.critical
                ? { scale: [0.9, 1.1, 0.9] }
                : { scale: 1 }
            }
            transition={
              row.critical
                ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                : undefined
            }
          >
            <Arrow
              className={cn(
                "h-4 w-4",
                row.critical ? "text-triage-red" : "text-foreground/60",
              )}
              aria-hidden
            />
          </motion.span>
        )}
      </span>
    </div>
  );
}

function AnimatedNumber({
  target,
  decimals,
  suffix,
}: {
  target: number;
  decimals: number;
  suffix?: string;
}) {
  const mv = useMotionValue(0);
  const formatted = useTransform(mv, (v) => {
    const fixed = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString();
    return suffix ? `${fixed}${suffix}` : fixed;
  });

  useEffect(() => {
    mv.set(0);
    const controls = animate(mv, target, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [target, mv]);

  return <motion.span>{formatted}</motion.span>;
}

function BPNumber({ systolic, diastolic }: { systolic: number; diastolic: number }) {
  const sMv = useMotionValue(0);
  const dMv = useMotionValue(0);
  const sText = useTransform(sMv, (v) => Math.round(v).toString());
  const dText = useTransform(dMv, (v) => Math.round(v).toString());

  useEffect(() => {
    sMv.set(0);
    dMv.set(0);
    const a = animate(sMv, systolic, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    });
    const b = animate(dMv, diastolic, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => {
      a.stop();
      b.stop();
    };
  }, [systolic, diastolic, sMv, dMv]);

  return (
    <span className="inline-flex items-baseline gap-0.5">
      <motion.span>{sText}</motion.span>
      <span>/</span>
      <motion.span>{dText}</motion.span>
    </span>
  );
}
