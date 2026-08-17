import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";
import { useAppStore } from "@/store/appStore";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const toggle = () => {
    const next = language === "ar" ? "en" : "ar";
    setLanguage(next);
    void i18n.changeLanguage(next);
  };

  // Show the switch target: if currently AR, show "EN"; if currently EN, show "ع".
  const label = language === "ar" ? "EN" : "ع";

  return (
    <Toggle
      pressed={language === "ar"}
      onPressedChange={toggle}
      variant="outline"
      size="sm"
      aria-label="Toggle language"
      className="gap-1.5 border-medical-cyan/30 bg-medical-surface/40 text-medical-glow hover:bg-medical-cyan/10 hover:text-medical-glow data-[state=on]:bg-medical-cyan/10 data-[state=on]:text-medical-glow"
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="text-xs font-semibold tracking-wider">{label}</span>
    </Toggle>
  );
}
