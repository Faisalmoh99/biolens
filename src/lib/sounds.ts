import { useAppStore } from "@/store/appStore";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType = "sine",
  startGain = 0.15,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(startGain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + durationMs / 1000,
  );
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

function guarded(fn: () => void) {
  if (useAppStore.getState().soundEnabled) fn();
}

export const playLockBeep = () => guarded(() => tone(880, 60, "sine"));

export const playStageAdvance = () =>
  guarded(() => tone(600, 80, "triangle"));

export const playSuccessChime = () =>
  guarded(() => {
    tone(800, 100, "sine");
    setTimeout(() => tone(1000, 100, "sine"), 80);
    setTimeout(() => tone(1200, 150, "sine"), 160);
  });

export const playFailBuzz = () =>
  guarded(() => tone(200, 200, "sawtooth", 0.1));

export const playSoftClick = () =>
  guarded(() => tone(1200, 20, "sine", 0.08));
