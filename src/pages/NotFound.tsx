import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home as HomeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { PageTransition } from "@/components/layout/PageTransition";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <PageTransition>
      <div className="flex min-h-full items-center justify-center px-6 py-12">
        <GlowCard className="flex flex-col items-center gap-6 px-12 py-14 text-center">
          <div className="bg-gradient-to-b from-cyan-300 via-white to-cyan-300 bg-clip-text text-8xl font-bold tracking-wider text-transparent">
            404
          </div>
          <p className="text-base text-muted-foreground">{t("pages.notFound")}</p>
          <Button
            asChild
            size="lg"
            className="gap-2 bg-medical-cyan text-medical-deep shadow-[0_0_25px_rgba(34,211,238,0.4)] hover:bg-medical-glow"
          >
            <Link to="/">
              <HomeIcon className="h-4 w-4" />
              {t("common.returnHome")}
            </Link>
          </Button>
        </GlowCard>
      </div>
    </PageTransition>
  );
}
