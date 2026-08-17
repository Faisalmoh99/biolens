import { useEffect, useRef, useState } from "react";

export interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export function useCamera({
  width = 1280,
  height = 720,
  facingMode = "user",
}: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let localStream: MediaStream | null = null;

    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode,
          },
          audio: false,
        });
        if (!mounted) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        localStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
          if (mounted) setReady(true);
        }
      } catch (e) {
        if (!mounted) return;
        const msg =
          e instanceof Error ? e.message : "Camera unavailable";
        setError(msg);
      }
    }
    start();

    return () => {
      mounted = false;
      setReady(false);
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      setStream(null);
    };
  }, [width, height, facingMode]);

  return { videoRef, stream, error, ready };
}
