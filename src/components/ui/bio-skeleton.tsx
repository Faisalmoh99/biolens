import { cn } from "@/lib/utils";

export function BioSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-medical-cyan/10 bg-medical-surface/40",
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-skeleton-sweep bg-gradient-to-r from-transparent via-medical-cyan/15 to-transparent" />
    </div>
  );
}
