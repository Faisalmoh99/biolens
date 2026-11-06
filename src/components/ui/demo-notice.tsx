import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/** Calm, non-error notice shown in demo builds when a result isn't cached. */
export function DemoNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border border-medical-cyan/25 bg-medical-cyan/5 px-3 py-2 text-xs text-medical-glow/80",
        className,
      )}
    >
      <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t("demo.unavailable")}</span>
    </div>
  );
}
