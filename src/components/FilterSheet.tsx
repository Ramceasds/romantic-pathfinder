import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { INTERESTED_IN, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  saving: boolean;
  onSave: (v: { interested_in: string; min_age: number; max_age: number }) => void;
};

export function FilterSheet({ open, onOpenChange, profile, saving, onSave }: Props) {
  const [interestedIn, setInterestedIn] = useState(profile.interested_in);
  const [range, setRange] = useState<number[]>([profile.min_age, profile.max_age]);

  useEffect(() => {
    if (open) {
      setInterestedIn(profile.interested_in);
      setRange([profile.min_age, profile.max_age]);
    }
  }, [open, profile]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-[2rem] px-6 pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Show me</p>
            <div className="flex gap-2">
              {INTERESTED_IN.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setInterestedIn(o.value)}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors",
                    interestedIn === o.value
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "bg-card",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Age range</p>
              <p className="text-sm text-muted-foreground">
                {range[0]} – {range[1]}
              </p>
            </div>
            <Slider min={18} max={80} step={1} minStepsBetweenThumbs={1} value={range} onValueChange={setRange} />
          </div>

          <Button
            size="lg"
            disabled={saving}
            onClick={() => onSave({ interested_in: interestedIn, min_age: range[0] ?? 18, max_age: range[1] ?? 80 })}
            className="h-14 w-full rounded-full bg-gradient-primary text-base shadow-glow"
          >
            Apply filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
