import { cn } from "@/lib/utils";

interface AmbientBackgroundProps {
  className?: string;
  intensity?: "subtle" | "vibrant";
}

export function AmbientBackground({ className, intensity = "subtle" }: AmbientBackgroundProps) {
  const isVibrant = intensity === "vibrant";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none -z-10",
        className,
      )}
      aria-hidden="true"
    >
      {/* Top warm romantic glow orb */}
      <div
        className={cn(
          "absolute -top-24 -left-20 h-80 w-80 rounded-full blur-3xl transition-opacity duration-1000",
          isVibrant
            ? "bg-gradient-to-br from-rose-400/40 via-primary/30 to-amber-300/25"
            : "bg-gradient-to-br from-rose-300/25 via-primary/20 to-amber-200/15",
        )}
      />

      {/* Right side accent glow orb */}
      <div
        className={cn(
          "absolute top-1/3 -right-24 h-72 w-72 rounded-full blur-3xl transition-opacity duration-1000",
          isVibrant
            ? "bg-gradient-to-bl from-amber-400/35 via-rose-400/25 to-pink-500/20"
            : "bg-gradient-to-bl from-amber-300/20 via-rose-300/15 to-transparent",
        )}
      />

      {/* Bottom ambient wash */}
      <div
        className={cn(
          "absolute -bottom-20 left-1/4 h-80 w-80 rounded-full blur-3xl transition-opacity duration-1000",
          isVibrant
            ? "bg-gradient-to-tr from-pink-500/25 via-rose-400/20 to-amber-200/20"
            : "bg-gradient-to-tr from-pink-300/15 via-rose-200/10 to-transparent",
        )}
      />

      {/* Soft decorative floating sparkles/dots */}
      <div className="absolute top-20 right-10 h-2 w-2 rounded-full bg-primary/40 blur-[0.5px] animate-float" />
      <div className="absolute top-44 left-8 h-2.5 w-2.5 rounded-full bg-amber-400/45 blur-[0.5px] animate-float-delayed" />
      <div className="absolute bottom-40 right-14 h-1.5 w-1.5 rounded-full bg-rose-400/40 blur-[0.5px] animate-float-reverse" />
    </div>
  );
}
