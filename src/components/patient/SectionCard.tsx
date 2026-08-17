import type { ReactNode } from "react";

export function SectionCard({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-medical-cyan/20 bg-medical-surface/60 p-4 backdrop-blur-sm ${className ?? ""}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-medical-glow">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
