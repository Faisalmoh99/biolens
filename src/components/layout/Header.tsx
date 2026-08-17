import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Activity, BarChart3, Eye, Home as HomeIcon, Map as MapIcon, Scan as ScanIcon, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { SoundToggle } from "@/components/layout/SoundToggle";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";

function useMeccaClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Riyadh",
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function IrisLogo() {
  return (
    <motion.svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
    >
      <circle cx="16" cy="16" r="14" stroke="#22d3ee" strokeWidth="1" opacity="0.4" />
      <circle cx="16" cy="16" r="10" stroke="#22d3ee" strokeWidth="1.25" opacity="0.7" />
      <circle cx="16" cy="16" r="6" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2.5" fill="#22d3ee">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
    </motion.svg>
  );
}

function ScanModePill() {
  const scanMode = useAppStore((s) => s.scanMode);
  const { t } = useTranslation();
  const isLive = scanMode === "live";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
        isLive
          ? "border-red-500/40 bg-red-500/10 text-red-300"
          : "border-medical-cyan/30 bg-medical-cyan/10 text-medical-glow",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isLive ? "bg-red-500 animate-pulse-glow" : "bg-medical-glow animate-pulse-glow",
        )}
      />
      {t(isLive ? "mode.live" : "mode.demo")}
    </div>
  );
}

interface NavItem {
  to: string;
  icon: typeof HomeIcon;
  labelKey: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/home", icon: HomeIcon, labelKey: "nav.home" },
  { to: "/scan", icon: ScanIcon, labelKey: "nav.scan" },
  { to: "/triage", icon: Users, labelKey: "nav.triage" },
  { to: "/map", icon: MapIcon, labelKey: "nav.map" },
  { to: "/dashboard", icon: BarChart3, labelKey: "nav.dashboard" },
];

function NavItemButton({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.to === "/home"}>
      {({ isActive }) => (
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 text-sm transition-colors",
            isActive
              ? "bg-medical-cyan/10 text-medical-glow hover:bg-medical-cyan/15 hover:text-medical-glow"
              : "text-muted-foreground hover:bg-medical-surface/60 hover:text-medical-glow",
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{t(item.labelKey)}</span>
        </Button>
      )}
    </NavLink>
  );
}

export function Header() {
  const now = useMeccaClock();
  const time = TIME_FORMAT.format(now);
  const date = DATE_FORMAT.format(now);

  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-medical-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-6">
        {/* Left: Logo */}
        <NavLink to="/home" className="group flex items-center gap-3">
          <IrisLogo />
          <div className="flex flex-col leading-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-white to-cyan-300 bg-clip-text text-lg font-bold tracking-wider text-transparent">
              BioLens
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-medical-cyan/60">
              Hajj Emergency ID
            </span>
          </div>
        </NavLink>

        {/* Center: Live clock */}
        <div className="hidden flex-col items-center md:flex">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-medical-glow" />
            <span className="font-mono text-base font-semibold tabular-nums tracking-wider text-medical-glow">
              {time}
            </span>
          </div>
          <span className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {date} · Mecca
          </span>
        </div>

        {/* Right: pill + nav + language */}
        <div className="flex items-center gap-3">
          <ScanModePill />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavItemButton key={item.to} item={item} />
            ))}
          </nav>
          <SoundToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Bottom gradient border */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-medical-cyan/60 to-transparent"
      />
    </header>
  );
}
