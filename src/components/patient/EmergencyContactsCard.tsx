import { useTranslation } from "react-i18next";
import { Phone, Users } from "lucide-react";

import { SectionCard } from "@/components/patient/SectionCard";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types/patient";

function formatPhone(p: string) {
  return p.replace(/\s+/g, " ").trim();
}

function cleanPhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}

export function EmergencyContactsCard({ patient }: { patient: Patient }) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const companion = patient.companion ?? null;
  const hasContacts = patient.emergencyContacts.length > 0;

  if (!companion && !hasContacts) return null;

  const companionPhoneClean = companion ? cleanPhone(companion.phoneSA) : "";

  return (
    <SectionCard
      title={t("profile.section.contacts")}
      icon={<Users className="h-4 w-4" />}
    >
      {companion ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-triage-green/30 bg-triage-green/5 p-3">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-triage-green/40 bg-triage-green/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-triage-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-triage-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-triage-green" />
              </span>
              {t("profile.companion.local")}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div
                className={cn(
                  "text-lg font-medium text-foreground",
                  isAr && "font-arabic",
                )}
              >
                {isAr ? companion.nameAr : companion.name}
              </div>
              <div
                className={cn(
                  "text-sm text-foreground/60",
                  !isAr && "font-arabic",
                )}
              >
                {isAr ? companion.name : companion.nameAr}
              </div>
            </div>

            <div className="mt-0.5 text-xs uppercase tracking-wider text-foreground/55">
              {isAr ? companion.relationship.ar : companion.relationship.en}
            </div>

            <a
              href={`tel:${companionPhoneClean}`}
              className="mt-3 inline-flex items-center gap-2 rounded-md border border-triage-green/50 bg-triage-green/15 px-3 py-2 text-sm font-medium text-triage-green hover:bg-triage-green/25"
              aria-label={t("profile.companion.call")}
            >
              <Phone className="h-4 w-4" aria-hidden />
              <span
                dir="ltr"
                style={{ unicodeBidi: "isolate", display: "inline-block" }}
              >
                {formatPhone(companion.phoneSA)}
              </span>
            </a>

            {companion.languages.length > 0 && (
              <div className="mt-2 text-xs text-foreground/50">
                {t("profile.companion.speaks")}: {companion.languages.join(", ")}
              </div>
            )}
          </div>

          {hasContacts && (
            <>
              <div className="h-px bg-white/5" />
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                  {t("profile.contacts.home")}
                </h4>
                <ul className="space-y-1.5 text-xs">
                  {patient.emergencyContacts.map((c, i) => {
                    const phoneClean = cleanPhone(c.phone);
                    return (
                      <li
                        key={i}
                        className="flex flex-wrap items-center justify-between gap-2 px-1 py-1"
                      >
                        <div className="min-w-0">
                          <div className="text-foreground/70">{c.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-foreground/40">
                            {c.relationship} • {c.language}
                          </div>
                        </div>
                        <a
                          href={`tel:${phoneClean}`}
                          className="text-foreground/55 underline-offset-2 hover:text-foreground/80 hover:underline"
                        >
                          <span
                            dir="ltr"
                            style={{
                              unicodeBidi: "isolate",
                              display: "inline-block",
                            }}
                          >
                            {formatPhone(c.phone)}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs italic text-foreground/55">
            {t("profile.contacts.noCompanion")}
          </div>
          <ul className="space-y-2 text-sm">
            {patient.emergencyContacts.map((c, i) => {
              const phoneClean = cleanPhone(c.phone);
              return (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/5 bg-medical-deep/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{c.name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-foreground/55">
                      {c.relationship} • {c.language}
                    </div>
                  </div>
                  <a
                    href={`tel:${phoneClean}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-medical-cyan/40 bg-medical-cyan/10 px-2.5 py-1 text-xs font-medium text-medical-glow hover:bg-medical-cyan/20"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden />
                    <span
                      dir="ltr"
                      style={{
                        unicodeBidi: "isolate",
                        display: "inline-block",
                      }}
                    >
                      {formatPhone(c.phone)}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
