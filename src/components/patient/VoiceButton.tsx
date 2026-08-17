import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { playSoftClick } from "@/lib/sounds";
import type { LifeSavingFactsResponse } from "@/types/ai";
import type { LangCode } from "@/lib/translation";
import type { Patient } from "@/types/patient";

const LANG_BCP47: Record<LangCode, string> = {
  ar: "ar-SA",
  en: "en-US",
};

export interface VoiceButtonProps {
  patient: Patient;
  facts: LifeSavingFactsResponse | null;
  lang: LangCode;
}

export function VoiceButton({ patient, facts, lang }: VoiceButtonProps) {
  const { t } = useTranslation();
  const { speakSequence, stop, speaking, supported } = useVoiceOutput();

  const script = useMemo(() => {
    if (!facts) return [] as string[];
    const name = lang === "ar" ? patient.fullName.ar : patient.fullName.en;
    const intro = t("voice.script.intro", { name });
    const sentences = facts.facts.slice(0, 3).map((f, i) => {
      const number = t(`voice.script.ordinal.${i + 1}`, {
        defaultValue: String(i + 1),
      });
      return t("voice.script.fact", {
        number,
        title: f.title,
        content: f.content,
        action: f.actionRecommended,
      });
    });
    return [intro, ...sentences];
  }, [facts, lang, patient, t]);

  const disabled = !supported || !facts || script.length === 0;

  function handleClick() {
    playSoftClick();
    if (speaking) {
      stop();
      return;
    }
    speakSequence(script, { lang: LANG_BCP47[lang] });
  }

  if (!supported) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button
                variant="outline"
                disabled
                className="border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow"
              >
                <Volume2 className="h-4 w-4" aria-hidden />
                {t("voice.readAloud")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("voice.unsupported")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className="relative inline-flex">
        {speaking && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-md ring-2 ring-medical-cyan/60"
            initial={{ opacity: 0.4, scale: 0.96 }}
            animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              boxShadow: "0 0 24px rgba(34,211,238,0.55)",
            }}
          />
        )}
        <Button
          variant="outline"
          disabled={disabled}
          onClick={handleClick}
          aria-pressed={speaking}
          className={cn(
            "relative border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow hover:bg-medical-cyan/10",
            speaking && "border-medical-cyan bg-medical-cyan/15",
          )}
        >
          {speaking ? <PulseBars /> : <Volume2 className="h-4 w-4" aria-hidden />}
          {speaking ? t("voice.stop") : t("voice.readAloud")}
        </Button>
      </div>

      <AnimatePresence>
        {speaking && (
          <motion.div
            key="voice-indicator"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed left-1/2 top-4 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-medical-cyan/50 bg-medical-deep/95 px-4 py-2 text-sm text-medical-glow shadow-[0_0_24px_rgba(34,211,238,0.45)] backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-medical-cyan opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-medical-cyan" />
              </span>
              <span className="font-medium tracking-wide">
                {t("voice.speaking")}
              </span>
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-1 rounded-full border border-medical-cyan/40 bg-medical-cyan/10 px-2 py-0.5 text-xs text-medical-glow hover:bg-medical-cyan/20"
              >
                <Square className="h-3 w-3" aria-hidden />
                {t("voice.stop")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PulseBars() {
  return (
    <span
      aria-hidden
      className="inline-flex h-4 w-4 items-end justify-center gap-[2px]"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-sm bg-medical-glow"
          initial={{ height: "30%" }}
          animate={{ height: ["30%", "100%", "30%"] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}
