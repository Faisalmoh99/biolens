import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Header } from "@/components/layout/Header";
import { FailsafeBanner } from "@/components/layout/FailsafeBanner";

const GRID_PATTERN_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'>
    <path d='M40 0H0V40' fill='none' stroke='%2322d3ee' stroke-width='0.5' stroke-opacity='0.6' />
  </svg>`,
)}")`;

export function AppLayout() {
  const { i18n } = useTranslation();

  return (
    <div
      data-language={i18n.language}
      className="relative flex min-h-screen flex-col bg-medical-deep text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(34, 211, 238, 0.18) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(6, 182, 212, 0.10) 0%, transparent 65%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage: GRID_PATTERN_URI,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <FailsafeBanner />
        <main className="relative flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
