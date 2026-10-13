import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Heart, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { FilterSheet, type FilterValues } from "@/components/FilterSheet";
import { SafetyMenu } from "@/components/SafetyMenu";
import { rankCandidates, type Candidate } from "@/lib/discovery";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { gendersFor, type Profile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Ember" },
      { name: "description", content: "Swipe through profiles and like the people you want to meet." },
      { property: "og:title", content: "Discover — Ember" },
      { property: "og:description", content: "Swipe through profiles and like the people you want to meet." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyProfile(user?.id);
  const [epoch, setEpoch] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const deckKey = me
    ? ["deck", me.id, me.interested_in, me.min_age, me.max_age, me.max_distance_km, me.latitude, me.longitude, me.filter_interests.join(","), me.sort_by_shared, epoch]
    : ["deck"];
  const { data: profiles, isLoading } = useQuery({
    queryKey: deckKey,
    enabled: !!me,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Candidate[]> => {
      const [{ data: swiped, error: e1 }, { data: blocked, error: e3 }] = await Promise.all([
        supabase.from("swipes").select("target").eq("swiper", me!.id),
        supabase.rpc("blocked_profile_ids"),
      ]);
      if (e1) throw e1;
      if (e3) throw e3;
      const exclude = [me!.id, ...(swiped ?? []).map((s) => s.target), ...((blocked as string[] | null) ?? [])];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("id", "in", `(${exclude.join(",")})`)
        .in("gender", gendersFor(me!.interested_in))
        .gte("age", me!.min_age)
        .lte("age", me!.max_age)
        .limit(300);
      if (error) throw error;
      return rankCandidates(me!, data).slice(0, 60);
    },
  });

  const saveFilters = useMutation({
    mutationFn: async (v: FilterValues) => {
      const { error } = await supabase.from("profiles").update(v).eq("id", me!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["my-profile"] });
      setFiltersOpen(false);
    },
    onError: () => toast.error("Could not save filters"),
  });

  async function resetPasses() {
    if (!me) return;
    const { error } = await supabase.from("swipes").delete().eq("swiper", me.id).eq("liked", false);
    if (error) {
      toast.error("Could not reset");
      return;
    }
    setEpoch((n) => n + 1);
  }

  const { data: suggestions = [] } = useQuery({
    queryKey: ["interest-suggestions"],
    enabled: !!me,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("interests").limit(200);
      const count = new Map<string, number>();
      for (const r of data ?? []) for (const i of r.interests) count.set(i, (count.get(i) ?? 0) + 1);
      return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([i]) => i);
    },
  });

  const activeFilters = me
    ? (me.max_distance_km < 500 && me.latitude != null ? 1 : 0) + (me.filter_interests.length ? 1 : 0) + (me.interested_in !== "everyone" ? 1 : 0)
    : 0;

  if (!me) return null;

  return (
    <div className="flex h-full flex-col px-4 pb-4 pt-5">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl font-semibold">Ember</span>
        </div>
        <Button variant="outline" size="icon" className="relative h-10 w-10 rounded-full bg-card" onClick={() => setFiltersOpen(true)} aria-label="Filters">
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.7rem] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </Button>
      </header>

      {isLoading || !profiles ? (
        <div className="flex flex-1 items-center justify-center">
          <Flame className="h-8 w-8 animate-pulse text-primary" />
        </div>
      ) : (
        <Deck
          key={deckKey.join("|")}
          profiles={profiles}
          me={me}
          onReset={resetPasses}
          onOpenFilters={() => setFiltersOpen(true)}
        />
      )}

      <FilterSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        profile={me}
        suggestions={suggestions}
        saving={saveFilters.isPending}
        onSave={(v) => saveFilters.mutate(v)}
      />
    </div>
  );
}

function Deck({
  profiles,
  me,
  onReset,
  onOpenFilters,
}: {
  profiles: Candidate[];
  me: Profile;
  onReset: () => void;
  onOpenFilters: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = profiles.filter((p) => !hidden.includes(p.id));
  const [fly, setFly] = useState<"like" | "pass" | null>(null);
  const [match, setMatch] = useState<{ profile: Profile; matchId: string } | null>(null);

  const current = visible[idx];
  const next = visible[idx + 1];

  async function commit(target: Profile, liked: boolean) {
    const { error } = await supabase.from("swipes").insert({ swiper: me.id, target: target.id, liked });
    if (error) {
      toast.error("Could not save your choice");
      return;
    }
    if (liked) {
      const a = me.id < target.id ? me.id : target.id;
      const b = me.id < target.id ? target.id : me.id;
      const { data } = await supabase
        .from("matches")
        .select("id")
        .eq("profile_a", a)
        .eq("profile_b", b)
        .maybeSingle();
      if (data) {
        setMatch({ profile: target, matchId: data.id });
        qc.invalidateQueries({ queryKey: ["matches"] });
      }
    }
  }

  function decide(liked: boolean) {
    if (!current || fly) return;
    const target = current;
    setFly(liked ? "like" : "pass");
    commit(target, liked);
    setTimeout(() => {
      setIdx((n) => n + 1);
      setFly(null);
    }, 280);
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Heart className="h-9 w-9" />
        </span>
        <h2 className="text-2xl font-semibold">You're all caught up</h2>
        <p className="max-w-[16rem] text-sm text-muted-foreground">
          No more profiles match your filters right now. Widen them or bring back the people you passed on.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={onOpenFilters} className="rounded-full bg-gradient-primary px-6 shadow-glow">
            Change filters
          </Button>
          <Button variant="ghost" onClick={onReset} className="rounded-full">
            <RotateCcw className="mr-2 h-4 w-4" /> Show passed profiles again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-0 flex-1">
        {next && (
          <div className="absolute inset-0 scale-95 opacity-80">
            <SwipeCard key={next.id} profile={next} interactive={false} fly={null} onDecide={() => {}} />
          </div>
        )}
        <SwipeCard key={current.id} profile={current} interactive fly={fly} onDecide={decide} />
        {!fly && (
          <div className="absolute right-4 top-4 z-10">
            <SafetyMenu
              meId={me.id}
              target={current}
              onBlocked={() => setHidden((h) => [...h, current.id])}
              triggerClassName="bg-foreground/30 text-primary-foreground backdrop-blur"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 pt-5">
        <button
          onClick={() => decide(false)}
          aria-label="Pass"
          className="flex h-16 w-16 items-center justify-center rounded-full border bg-card text-pass shadow-soft transition-transform active:scale-90"
        >
          <X className="h-8 w-8" strokeWidth={3} />
        </button>
        <button
          onClick={() => decide(true)}
          aria-label="Like"
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform active:scale-90"
        >
          <Heart className="h-9 w-9 fill-current" />
        </button>
      </div>

      {match && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col items-center justify-center gap-6 bg-gradient-primary px-8 text-center text-primary-foreground">
          <h2 className="font-display text-5xl font-semibold">It's a match!</h2>
          <p className="opacity-90">You and {match.profile.display_name} liked each other.</p>
          <div className="flex items-center">
            <ProfilePhoto path={me.photo_url} name={me.display_name} className="h-32 w-32 -rotate-6 rounded-full border-4 border-primary-foreground" />
            <ProfilePhoto path={match.profile.photo_url} name={match.profile.display_name} className="-ml-6 h-32 w-32 rotate-6 rounded-full border-4 border-primary-foreground" />
          </div>
          <div className="mt-4 w-full space-y-3">
            <Button
              size="lg"
              variant="secondary"
              className="h-14 w-full rounded-full text-base"
              onClick={() => navigate({ to: "/chat/$matchId", params: { matchId: match.matchId } })}
            >
              Send a message
            </Button>
            <Button size="lg" variant="ghost" className="w-full rounded-full text-base text-primary-foreground hover:bg-card/20 hover:text-primary-foreground" onClick={() => setMatch(null)}>
              Keep swiping
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
