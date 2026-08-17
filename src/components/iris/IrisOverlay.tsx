import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { IrisBoundingBox, IrisData, IrisPoint } from "@/lib/mediapipe";

import { IrisLockOn } from "./IrisLockOn";

interface IrisOverlayProps {
  irisData: IrisData | null;
  videoWidth: number;
  videoHeight: number;
  className?: string;
}

const CYAN = "#22d3ee";
const MIRROR_STYLE = { transform: "scaleX(-1)" as const };

export function IrisOverlay({
  irisData,
  videoWidth,
  videoHeight,
  className,
}: IrisOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationPhaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Latest props funnelled into refs so the draw loop can read them without
  // re-mounting per frame.
  const irisRef = useRef<IrisData | null>(irisData);
  const dimsRef = useRef({ width: videoWidth, height: videoHeight });

  useEffect(() => {
    irisRef.current = irisData;
  }, [irisData]);

  useEffect(() => {
    dimsRef.current = { width: videoWidth, height: videoHeight };
  }, [videoWidth, videoHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    });
    ro.observe(parent);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const iris = irisRef.current;
      const { width: vw, height: vh } = dimsRef.current;

      if (!iris || vw === 0 || vh === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      animationPhaseRef.current =
        (animationPhaseRef.current + 0.04) % (Math.PI * 2);
      const pulse = 0.7 + 0.3 * Math.sin(animationPhaseRef.current);

      const toPx = (p: IrisPoint) => ({ x: p.x * w, y: p.y * h });
      const bboxToPx = (b: IrisBoundingBox) => ({
        x: b.x * w,
        y: b.y * h,
        width: b.width * w,
        height: b.height * h,
      });

      drawCrosshair(ctx, toPx(iris.rightCenter), w, h);
      drawCrosshair(ctx, toPx(iris.leftCenter), w, h);

      drawIrisCircle(ctx, bboxToPx(iris.rightBoundingBox), pulse);
      drawIrisCircle(ctx, bboxToPx(iris.leftBoundingBox), pulse);

      drawIrisDots(ctx, iris.rightPoints.map(toPx));
      drawIrisDots(ctx, iris.leftPoints.map(toPx));
      drawCenterDot(ctx, toPx(iris.rightCenter));
      drawCenterDot(ctx, toPx(iris.leftCenter));

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <IrisLockOn
        centerX={irisData?.rightCenter.x ?? 0}
        centerY={irisData?.rightCenter.y ?? 0}
        active={!!irisData}
      />
      <AnimatePresence>
        {irisData && (
          <TargetAcquiredHUD
            centerX={irisData.rightCenter.x}
            centerY={irisData.rightCenter.y}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface HUDProps {
  centerX: number;
  centerY: number;
}

function TargetAcquiredHUD({ centerX, centerY }: HUDProps) {
  const { t } = useTranslation();
  // Container is inside a parent with scaleX(-1) applied. To position the
  // label visually upper-right of the iris, we translate upper-LEFT in DOM
  // (the mirror flips X). Then we counter-mirror the inner content so the
  // text reads normally and the connecting line draws toward the iris.
  return (
    <motion.div
      key="target-acquired"
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: 1, x: -80, y: -80 }}
      exit={{ opacity: 0, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute"
      style={{
        left: `${centerX * 100}%`,
        top: `${centerY * 100}%`,
      }}
    >
      <div className="relative" style={MIRROR_STYLE}>
        {/* Connecting dashed line from label corner back to iris center.
            Since iris is to the lower-right of this DOM box (after counter
            mirror, since the box is anchored at iris center in DOM but
            translated 80px upper-LEFT in DOM = upper-RIGHT visually), the
            line goes from origin (top-left of un-mirrored box) down-right
            to (80, 80) — i.e., back to the iris. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: 0,
            top: 0,
            width: 96,
            height: 96,
            overflow: "visible",
          }}
        >
          <line
            x1={0}
            y1={0}
            x2={80}
            y2={80}
            stroke={CYAN}
            strokeOpacity={0.55}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        </svg>
        <div className="relative inline-flex items-center gap-1 border border-medical-cyan/70 bg-medical-deep/70 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-medical-glow shadow-[0_0_18px_rgba(34,211,238,0.35)] backdrop-blur-sm">
          <CornerBracketDecor />
          <span>{t("scan.hud.acquired")}</span>
        </div>
      </div>
    </motion.div>
  );
}

function CornerBracketDecor() {
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 8 8"
        className="absolute -left-1 -top-1 h-2 w-2 text-medical-cyan"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M1 4V1H4" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 8 8"
        className="absolute -right-1 -top-1 h-2 w-2 text-medical-cyan"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 1H7V4" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 8 8"
        className="absolute -bottom-1 -left-1 h-2 w-2 text-medical-cyan"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M1 4V7H4" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        viewBox="0 0 8 8"
        className="absolute -bottom-1 -right-1 h-2 w-2 text-medical-cyan"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M4 7H7V4" strokeLinecap="round" />
      </svg>
    </>
  );
}

function drawIrisCircle(
  ctx: CanvasRenderingContext2D,
  bbox: { x: number; y: number; width: number; height: number },
  pulse: number,
) {
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;
  const r = Math.max(bbox.width, bbox.height) / 2;

  ctx.save();
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 14 * pulse;
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.85 * pulse + 0.15})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.2 * pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawIrisDots(ctx: CanvasRenderingContext2D, points: IrisPoint[]) {
  ctx.save();
  for (const p of points) {
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCenterDot(ctx: CanvasRenderingContext2D, p: IrisPoint) {
  ctx.save();
  ctx.shadowColor = CYAN;
  ctx.shadowBlur = 10;
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  center: IrisPoint,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(34, 211, 238, 0.18)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 8]);

  ctx.beginPath();
  ctx.moveTo(0, center.y);
  ctx.lineTo(w, center.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(center.x, 0);
  ctx.lineTo(center.x, h);
  ctx.stroke();

  ctx.restore();
}
