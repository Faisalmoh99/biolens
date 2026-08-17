import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScanLine } from "@/components/ui/scan-line";
import { useCamera } from "@/hooks/useCamera";
import { useIrisDetection } from "@/hooks/useIrisDetection";
import type { IrisData } from "@/lib/mediapipe";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";

import { IrisOverlay } from "./IrisOverlay";

interface IrisScannerProps {
  onIrisDetected?: (data: IrisData) => void;
  className?: string;
}

const MIRROR_STYLE = { transform: "scaleX(-1)" as const };

export const IrisScanner = forwardRef<HTMLVideoElement, IrisScannerProps>(
  function IrisScanner({ onIrisDetected, className }, forwardedRef) {
    const { t } = useTranslation();
    const scanMode = useAppStore((s) => s.scanMode);
    const directorMode = useAppStore((s) => s.directorMode);

    const { videoRef, error, ready } = useCamera();
    const { irisData, fps, loading } = useIrisDetection(videoRef, ready);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useImperativeHandle(forwardedRef, () => videoRef.current as HTMLVideoElement, [videoRef]);

    // Keep the consumer callback in a ref so the propagating effect can have
    // stable deps and not re-fire when the parent passes a new function ref.
    const onIrisDetectedRef = useRef(onIrisDetected);
    useEffect(() => {
      onIrisDetectedRef.current = onIrisDetected;
    }, [onIrisDetected]);

    useEffect(() => {
      if (irisData) onIrisDetectedRef.current?.(irisData);
    }, [irisData]);

    const handleLoadedMetadata = () => {
      const v = videoRef.current;
      if (v) setDims({ width: v.videoWidth, height: v.videoHeight });
    };

    if (error) {
      return (
        <div
          className={cn(
            "relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-medical-cyan/30 bg-black shadow-[0_0_60px_rgba(34,211,238,0.15)]",
            className,
          )}
        >
          <CornerBrackets />
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="rounded-full border border-red-500/40 bg-red-500/10 p-3">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-red-300">{t("scan.error.permission")}</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => location.reload()}>
              {t("scan.error.retry")}
            </Button>
          </div>
        </div>
      );
    }

    const statusKey = loading
      ? "scan.initializing"
      : irisData
        ? "scan.locked"
        : "scan.searching";

    return (
      <div
        className={cn(
          "relative aspect-video overflow-hidden rounded-2xl border border-medical-cyan/30 bg-black shadow-[0_0_60px_rgba(34,211,238,0.15)]",
          className,
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          style={MIRROR_STYLE}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0" style={MIRROR_STYLE}>
          <IrisOverlay
            irisData={irisData}
            videoWidth={dims.width}
            videoHeight={dims.height}
          />
        </div>

        <ScanLine />
        <CornerBrackets />

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-4 top-4"
        >
          {scanMode === "live" ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              {t("mode.live").toUpperCase()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-medical-cyan/40 bg-medical-cyan/10 px-3 py-1 text-xs font-medium text-medical-glow backdrop-blur-sm">
              <span className="text-medical-glow">◆</span>
              {t("mode.demo").toUpperCase()}
            </span>
          )}
        </motion.div>

        <div className="absolute bottom-4 left-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={statusKey}
              initial={
                statusKey === "scan.locked"
                  ? { scale: 1.3, opacity: 0 }
                  : { y: 12, opacity: 0 }
              }
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{
                type: statusKey === "scan.locked" ? "spring" : "tween",
                duration: 0.3,
                stiffness: 220,
                damping: 16,
              }}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                statusKey === "scan.locked"
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : "border-medical-cyan/30 bg-medical-cyan/10 text-medical-glow",
              )}
            >
              {statusKey === "scan.locked" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {t(statusKey)}
            </motion.div>
          </AnimatePresence>
        </div>

        {directorMode && (
          <div className="absolute bottom-4 right-4 font-mono text-[11px] text-medical-glow/70">
            {fps} fps
          </div>
        )}
      </div>
    );
  },
);

function CornerBrackets() {
  const stroke = "stroke-medical-cyan/70";
  return (
    <>
      <svg
        aria-hidden
        className={cn("pointer-events-none absolute left-3 top-3 h-6 w-6", stroke)}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
      >
        <path d="M2 8V2H8" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        className={cn("pointer-events-none absolute right-3 top-3 h-6 w-6", stroke)}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
      >
        <path d="M16 2H22V8" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        className={cn("pointer-events-none absolute bottom-3 left-3 h-6 w-6", stroke)}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
      >
        <path d="M2 16V22H8" strokeLinecap="round" />
      </svg>
      <svg
        aria-hidden
        className={cn("pointer-events-none absolute bottom-3 right-3 h-6 w-6", stroke)}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
      >
        <path d="M22 16V22H16" strokeLinecap="round" />
      </svg>
    </>
  );
}

