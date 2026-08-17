import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

const SPEECH_SUPPORTED =
  typeof window !== "undefined" && "speechSynthesis" in window;

export function useVoiceOutput() {
  const [speaking, setSpeaking] = useState(false);
  const supported = SPEECH_SUPPORTED;
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);

  const findVoice = useCallback(
    (lang: string): SpeechSynthesisVoice | null => {
      if (typeof window === "undefined" || !("speechSynthesis" in window))
        return null;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;
      const prefix = lang.split("-")[0];
      return (
        voices.find((v) => v.lang === lang) ||
        voices.find((v) => v.lang.startsWith(prefix)) ||
        null
      );
    },
    [],
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    queueRef.current = [];
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, options: VoiceOptions = {}) => {
      if (!supported) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = options.lang ?? "ar-SA";
      u.rate = options.rate ?? 0.95;
      u.pitch = options.pitch ?? 1.0;
      u.volume = options.volume ?? 1.0;
      const voice = findVoice(u.lang);
      if (voice) u.voice = voice;
      u.onstart = () => setSpeaking(true);
      u.onend = () => {
        queueRef.current = queueRef.current.filter((q) => q !== u);
        if (queueRef.current.length === 0) setSpeaking(false);
      };
      u.onerror = () => setSpeaking(false);
      queueRef.current.push(u);
      window.speechSynthesis.speak(u);
    },
    [supported, findVoice],
  );

  const speakSequence = useCallback(
    (items: string[], options: VoiceOptions = {}) => {
      stop();
      items.forEach((t) => speak(t, options));
    },
    [speak, stop],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, speakSequence, stop, speaking, supported };
}
