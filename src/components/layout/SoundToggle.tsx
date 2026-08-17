import { useTranslation } from "react-i18next";
import { Volume2, VolumeX } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { playSoftClick } from "@/lib/sounds";
import { useAppStore } from "@/store/appStore";

export function SoundToggle() {
  const { t } = useTranslation();
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled);

  const tooltipLabel = soundEnabled
    ? t("header.sound.mute")
    : t("header.sound.unmute");

  function handleClick() {
    if (soundEnabled) {
      // play the click first so user hears confirmation, then mute
      playSoftClick();
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      playSoftClick();
    }
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            pressed={soundEnabled}
            onPressedChange={handleClick}
            variant="outline"
            size="sm"
            aria-label={tooltipLabel}
            className="gap-1.5 border-medical-cyan/30 bg-medical-surface/40 text-medical-glow hover:bg-medical-cyan/10 hover:text-medical-glow data-[state=on]:bg-medical-cyan/10 data-[state=on]:text-medical-glow"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>{tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
