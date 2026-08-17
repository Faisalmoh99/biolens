import { cn } from "@/lib/utils";

export function ScanLine({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-16 animate-scan-line bg-gradient-to-b from-transparent via-medical-glow/40 to-transparent",
        className,
      )}
    />
  );
}
