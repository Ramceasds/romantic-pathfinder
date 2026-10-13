import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmberLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function EmberLogo({ size = "md", showText = true, className }: EmberLogoProps) {
  const iconSizes = {
    sm: "h-8 w-8 rounded-xl",
    md: "h-10 w-10 rounded-2xl",
    lg: "h-14 w-14 rounded-3xl",
  };

  const flameSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div className="relative group">
        {/* Ambient backlight glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-rose-500 to-amber-400 opacity-60 blur-md transition duration-500 group-hover:opacity-100 animate-pulse-glow" />
        
        {/* Ember badge */}
        <span
          className={cn(
            "relative flex items-center justify-center bg-gradient-romantic text-primary-foreground shadow-glow border border-white/25",
            iconSizes[size],
          )}
        >
          <Flame className={cn("fill-white/20 transition-transform duration-300 group-hover:scale-110", flameSizes[size])} />
        </span>
      </div>

      {showText && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground transition-colors",
            textSizes[size],
          )}
        >
          Ember
        </span>
      )}
    </div>
  );
}
