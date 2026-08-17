import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import { translateFacts, type LangCode } from "@/lib/translation";
import { playSoftClick } from "@/lib/sounds";
import type { LifeSavingFactsResponse } from "@/types/ai";

export interface TranslateButtonProps {
  patientId: string;
  originalFacts: LifeSavingFactsResponse | null;
  originalLang: LangCode;
  displayedLang: LangCode;
  onTranslated: (
    translated: LifeSavingFactsResponse,
    lang: LangCode,
  ) => void;
}

export function TranslateButton({
  patientId,
  originalFacts,
  originalLang,
  displayedLang,
  onTranslated,
}: TranslateButtonProps) {
  const { t } = useTranslation();
  const cache = useAppStore((s) => s.factsTranslationCache);
  const setFactsTranslation = useAppStore((s) => s.setFactsTranslation);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherLang: LangCode = originalLang === "ar" ? "en" : "ar";
  const showingOriginal = displayedLang === originalLang;
  const disabled = !originalFacts || loading;

  async function handleClick() {
    playSoftClick();
    if (!originalFacts) return;
    setError(null);

    if (!showingOriginal) {
      onTranslated(originalFacts, originalLang);
      return;
    }

    const cached = cache[patientId]?.[otherLang];
    if (cached) {
      onTranslated(cached, otherLang);
      return;
    }

    try {
      setLoading(true);
      const translated = await translateFacts(originalFacts, otherLang);
      setFactsTranslation(patientId, otherLang, translated);
      onTranslated(translated, otherLang);
    } catch (err) {
      console.error("[TranslateButton] translateFacts failed", err);
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  const label = loading
    ? t("translate.translating")
    : showingOriginal
      ? t("translate.to", { lang: t(`translate.lang.${otherLang}`) })
      : t("translate.viewOriginal");

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        disabled={disabled}
        onClick={handleClick}
        className="border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow hover:bg-medical-cyan/10"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Languages className="h-4 w-4" aria-hidden />
        )}
        {label}
      </Button>
      {error && (
        <span className="text-xs text-triage-red">{error}</span>
      )}
    </div>
  );
}
