import { useEffect, useMemo, useState } from "react";
import { Check, LocateFixed, MapPin, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { INTERESTED_IN, type Profile } from "@/lib/profile";
import { ANY_DISTANCE_KM } from "@/lib/discovery";
import { cn } from "@/lib/utils";

export type FilterValues = {
  interested_in: string;
  min_age: number;
  max_age: number;
  max_distance_km: number;
  filter_interests: string[];
  sort_by_shared: boolean;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  suggestions: string[];
  saving: boolean;
  onSave: (v: FilterValues) => void;
};

const DEFAULTS = { interested_in: "everyone", range: [18, 60], distance: ANY_DISTANCE_KM };

function Section({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl border bg-card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {hint && <p className="text-sm font-medium text-primary">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function FilterSheet({ open, onOpenChange, profile, suggestions, saving, onSave }: Props) {
  const [interestedIn, setInterestedIn] = useState(profile.interested_in);
  const [range, setRange] = useState<number[]>([profile.min_age, profile.max_age]);
  const [distance, setDistance] = useState(profile.max_distance_km);
  const [interests, setInterests] = useState<string[]>(profile.filter_interests);
  const [sortShared, setSortShared] = useState(profile.sort_by_shared);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(
    profile.latitude != null && profile.longitude != null ? { lat: profile.latitude, lng: profile.longitude } : null,
  );
  const [locating, setLocating] = useState(false);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!open) return;
    setInterestedIn(profile.interested_in);
    setRange([profile.min_age, profile.max_age]);
    setDistance(profile.max_distance_km);
    setInterests(profile.filter_interests);
    setSortShared(profile.sort_by_shared);
    setLoc(profile.latitude != null && profile.longitude != null ? { lat: profile.latitude, lng: profile.longitude } : null);
  }, [open, profile]);

  const chips = useMemo(() => {
    const all = [...profile.interests, ...suggestions, ...interests];
    const seen = new Set<string>();
    return all.filter((i) => {
      const k = i.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 24);
  }, [profile.interests, suggestions, interests]);

  const mine = new Set(profile.interests.map((i) => i.toLowerCase()));
  const isOn = (i: string) => interests.some((x) => x.toLowerCase() === i.toLowerCase());
  const toggle = (i: string) =>
    setInterests((cur) => (isOn(i) ? cur.filter((x) => x.toLowerCase() !== i.toLowerCase()) : [...cur, i].slice(0, 10)));

  function addCustom() {
    const v = custom.trim();
    if (v && !isOn(v)) toggle(v);
    setCustom("");
  }

  function locate() {
    if (!navigator.geolocation) {
      toast.error("Location isn't available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: +pos.coords.latitude.toFixed(3), lng: +pos.coords.longitude.toFixed(3) });
        setLocating(false);
        if (distance >= ANY_DISTANCE_KM) setDistance(50);
      },
      () => {
        setLocating(false);
        toast.error("Allow location access to filter by distance");
      },
      { timeout: 10000 },
    );
  }

  const activeCount =
    (interestedIn !== DEFAULTS.interested_in ? 1 : 0) +
    (range[0] !== 18 || range[1] !== 60 ? 1 : 0) +
    (loc && distance < ANY_DISTANCE_KM ? 1 : 0) +
    (interests.length ? 1 : 0);

  function reset() {
    setInterestedIn(DEFAULTS.interested_in);
    setRange(DEFAULTS.range);
    setDistance(DEFAULTS.distance);
    setInterests([]);
    setSortShared(true);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex max-h-[92dvh] max-w-md flex-col rounded-t-[2rem] p-0">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="flex-row items-center justify-between space-y-0 px-6 pt-3 text-left">
          <SheetTitle className="font-display text-2xl">
            Filters{activeCount > 0 && <span className="ml-2 align-middle text-sm font-sans text-primary">{activeCount} active</span>}
          </SheetTitle>
          <button type="button" onClick={reset} className="mr-8 text-sm font-medium text-muted-foreground hover:text-foreground">
            Reset
          </button>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <Section title="Show me">
            <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
              {INTERESTED_IN.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setInterestedIn(o.value)}
                  className={cn(
                    "rounded-full py-2 text-sm font-medium transition-all",
                    interestedIn === o.value ? "bg-card text-foreground shadow-soft" : "text-muted-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Age range" hint={`${range[0]} – ${range[1]}${range[1] === 80 ? "+" : ""}`}>
            <Slider min={18} max={80} step={1} minStepsBetweenThumbs={1} value={range} onValueChange={setRange} className="py-2" />
          </Section>

          <Section
            title="Maximum distance"
            hint={loc ? (distance >= ANY_DISTANCE_KM ? "Anywhere" : `${distance} km`) : undefined}
          >
            {loc ? (
              <>
                <Slider min={5} max={ANY_DISTANCE_KM} step={5} value={[distance]} onValueChange={(v) => setDistance(v[0] ?? ANY_DISTANCE_KM)} className="py-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Using your location</span>
                  <button type="button" onClick={locate} className="font-medium text-primary">{locating ? "Updating…" : "Update"}</button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={locate}
                className="flex w-full items-center gap-3 rounded-2xl bg-accent p-3 text-left text-accent-foreground"
              >
                <LocateFixed className="h-5 w-5 flex-none" />
                <span className="text-sm">
                  <span className="block font-semibold">{locating ? "Finding you…" : "Turn on location"}</span>
                  See how far people are and set a distance limit.
                </span>
              </button>
            )}
          </Section>

          <Section title="Shared interests" hint={interests.length ? `${interests.length} selected` : "Any"}>
            <p className="text-xs text-muted-foreground">Only show people who share at least one. <Sparkles className="inline h-3 w-3 text-primary" /> marks your own interests.</p>
            <div className="flex flex-wrap gap-2">
              {chips.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggle(i)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all active:scale-95",
                    isOn(i) ? "border-primary bg-primary text-primary-foreground shadow-glow" : "bg-background",
                  )}
                >
                  {isOn(i) ? <Check className="h-3.5 w-3.5" /> : mine.has(i.toLowerCase()) && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                maxLength={30}
                placeholder="Add an interest"
                className="h-10 min-w-0 flex-1 rounded-full border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={addCustom} aria-label="Add interest">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {interests.length > 0 && (
              <button type="button" onClick={() => setInterests([])} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <X className="h-3 w-3" /> Clear interests
              </button>
            )}
          </Section>

          <Section title="Sort">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">Most in common first</span>
                <span className="text-xs text-muted-foreground">Otherwise closest first</span>
              </span>
              <Switch checked={sortShared} onCheckedChange={setSortShared} />
            </label>
          </Section>
        </div>

        <div className="border-t bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            size="lg"
            disabled={saving}
            onClick={() =>
              onSave({
                interested_in: interestedIn,
                min_age: range[0] ?? 18,
                max_age: range[1] ?? 80,
                max_distance_km: distance,
                filter_interests: interests,
                sort_by_shared: sortShared,
                latitude: loc?.lat ?? null,
                longitude: loc?.lng ?? null,
              })
            }
            className="h-14 w-full rounded-full bg-gradient-primary text-base shadow-glow"
          >
            {saving ? "Saving…" : "Show matches"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
