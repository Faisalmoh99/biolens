import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, interactive = true, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "border-medical-cyan/20 bg-medical-surface/60 backdrop-blur-sm transition-all duration-300",
        interactive &&
          "hover:-translate-y-0.5 hover:border-medical-cyan/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]",
        className,
      )}
      {...props}
    />
  ),
);
GlowCard.displayName = "GlowCard";
