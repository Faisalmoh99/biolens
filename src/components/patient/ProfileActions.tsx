import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Pill } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VoiceButton } from "./VoiceButton";
import { TranslateButton } from "./TranslateButton";
import { SOAPDialog } from "./SOAPDialog";
import { DrugInteractionsDialog } from "./DrugInteractionsDialog";
import { playSoftClick } from "@/lib/sounds";
import { useAppStore } from "@/store/appStore";
import type { LifeSavingFactsResponse } from "@/types/ai";
import type { LangCode } from "@/lib/translation";
import type { Patient } from "@/types/patient";

export interface ProfileActionsProps {
  patient: Patient;
  originalFacts: LifeSavingFactsResponse | null;
  displayedFacts: LifeSavingFactsResponse | null;
  originalLang: LangCode;
  displayedLang: LangCode;
  onTranslated: (facts: LifeSavingFactsResponse, lang: LangCode) => void;
}

export function ProfileActions({
  patient,
  originalFacts,
  displayedFacts,
  originalLang,
  displayedLang,
  onTranslated,
}: ProfileActionsProps) {
  const { t } = useTranslation();
  const [soapOpen, setSoapOpen] = useState(false);
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const triageDecision = useAppStore((s) => s.triageDecisions[patient.id]);
  const triageActions = triageDecision?.immediateActions ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <VoiceButton
          patient={patient}
          facts={displayedFacts}
          lang={displayedLang}
        />
        <TranslateButton
          patientId={patient.id}
          originalFacts={originalFacts}
          originalLang={originalLang}
          displayedLang={displayedLang}
          onTranslated={onTranslated}
        />
        <Button
          variant="outline"
          onClick={() => {
            playSoftClick();
            setSoapOpen(true);
          }}
          className="border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow hover:bg-medical-cyan/10"
        >
          <FileText className="h-4 w-4" aria-hidden />
          {t("profile.action.soap")}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            playSoftClick();
            setInteractionsOpen(true);
          }}
          className="border-medical-cyan/40 bg-medical-cyan/5 text-medical-glow hover:bg-medical-cyan/10"
        >
          <Pill className="h-4 w-4" aria-hidden />
          {t("interactions.button")}
        </Button>
      </div>
      <SOAPDialog
        patient={patient}
        triageActions={triageActions}
        open={soapOpen}
        onOpenChange={setSoapOpen}
      />
      <DrugInteractionsDialog
        patient={patient}
        open={interactionsOpen}
        onOpenChange={setInteractionsOpen}
      />
    </>
  );
}
