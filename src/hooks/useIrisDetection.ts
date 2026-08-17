import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  extractIrisData,
  getFaceLandmarker,
  type IrisData,
} from "@/lib/mediapipe";
import { playLockBeep } from "@/lib/sounds";

export function useIrisDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
) {
  const [irisData, setIrisData] = useState<IrisData | null>(null);
  const [fps, setFps] = useState(0);
  const [loading, setLoading] = useState(true);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsRef = useRef(0);
  const wasLockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    lastFpsRef.current = performance.now();

    (async () => {
      const landmarker = await getFaceLandmarker();
      if (cancelled) return;
      setLoading(false);

      const tick = () => {
        if (cancelled) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          const ts = performance.now();
          if (ts !== lastTimeRef.current) {
            try {
              const result = landmarker.detectForVideo(video, ts);
              const data = extractIrisData(result);
              const nowLocked = !!data;
              if (nowLocked && !wasLockedRef.current) {
                playLockBeep();
              }
              wasLockedRef.current = nowLocked;
              setIrisData(data);
            } catch {
              // detection errors are non-fatal — keep the loop running
            }
            lastTimeRef.current = ts;
            frameCountRef.current++;
            if (ts - lastFpsRef.current > 1000) {
              setFps(
                Math.round(
                  (frameCountRef.current * 1000) / (ts - lastFpsRef.current),
                ),
              );
              frameCountRef.current = 0;
              lastFpsRef.current = ts;
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, videoRef]);

  return { irisData, fps, loading };
}
