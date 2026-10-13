import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Heart, RotateCcw, SlidersHorizontal, Sparkles, X, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import { FilterSheet } from "@/components/FilterSheet";
import { EmberLogo } from "@/components/EmberLogo";
import { AmbientBackground } from "@/components/AmbientBackground";
import { MatchCelebrationModal } from "@/components/MatchCelebrationModal";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { gendersFor, type Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

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
  const { isSubscribed } = useSubscription();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const deckKey = me ? ["deck", me.id, me.interested_in, me.min_age, me.max_age, epoch] : ["deck"];
  const { data: profiles, isLoading } = useQuery({
    queryKey: deckKey,
    enabled: !!me,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Profile[]> => {
      const { data: swiped, error: e1 } = await supabase.from("swipes").select("target").eq("swiper", me!.id);
      if (e1) throw e1;
      const exclude = [me!.id, ...(swiped ?? []).map((s) => s.target)];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("id", "in", `(${exclude.join(",")})`)
        .in("gender", gendersFor(me!.interested_in))
        .gte("age", me!.min_age)
        .lte("age", me!.max_age)
        .limit(40);
      if (error) throw error;
      return data;
    },
  });

  const saveFilters = useMutation({
    mutationFn: async (v: { interested_in: string; min_age: number; max_age: number }) => {
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

  if (!me) return null;

  return (
    <div className="relative flex h-full flex-col px-4 pb-4 pt-4 overflow-hidden">
      <AmbientBackground intensity="subtle" />

      <header className="mb-3 flex items-center justify-between">
        <EmberLogo size="sm" />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubscriptionModalOpen(true)}
            className={cn(
              "h-11 rounded-full px-3 text-xs font-bold transition-all shadow-soft backdrop-blur-md",
              isSubscribed
                ? "border-amber-400 bg-amber-500/15 text-amber-600 shadow-glow hover:bg-amber-500/25"
                : "border-amber-400/50 bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-600 hover:bg-amber-500/20 active:scale-95",
            )}
          >
            <Crown className="mr-1.5 h-4 w-4 fill-amber-500 text-amber-500" />
            {isSubscribed ? "Gold" : "Get Gold"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-full border border-border/60 bg-card/80 px-3 shadow-soft backdrop-blur-md transition-all hover:bg-card active:scale-95"
            onClick={() => setFiltersOpen(true)}
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-foreground/80" />
            <span className="ml-1.5 text-xs font-semibold">Filters</span>
          </Button>
        </div>
      </header>

      {isLoading || !profiles ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Flame className="h-10 w-10 animate-bounce text-primary" />
          </div>
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
        saving={saveFilters.isPending}
        onSave={(v) => saveFilters.mutate(v)}
      />

      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
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
  profiles: Profile[];
  me: Profile;
  onReset: () => void;
  onOpenFilters: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [fly, setFly] = useState<"like" | "pass" | null>(null);
  const [match, setMatch] = useState<{ profile: Profile; matchId: string } | null>(null);

  const current = profiles[idx];
  const next = profiles[idx + 1];

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
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/25 bg-gradient-to-tr from-primary/10 via-rose-500/15 to-amber-400/10 text-primary shadow-soft backdrop-blur-md">
            <Heart className="h-9 w-9 fill-primary/20" />
          </span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">You're all caught up</h2>
        <p className="max-w-[17rem] text-sm text-muted-foreground leading-relaxed">
          No more profiles match your filters right now. Widen your range or give passed profiles another look.
        </p>
        <div className="flex flex-col gap-2.5 pt-2 w-full max-w-xs">
          <Button
            onClick={onOpenFilters}
            className="h-12 rounded-full bg-gradient-romantic text-base font-semibold shadow-glow-strong hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Adjust filters
          </Button>
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-11 rounded-full border border-border/50 bg-card/60 text-sm backdrop-blur-md hover:bg-card"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Show passed profiles again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-0 flex-1">
        {next && (
          <div className="absolute inset-0 scale-[0.94] translate-y-2 opacity-75 blur-[0.3px] transition-all duration-300">
            <SwipeCard key={next.id} profile={next} interactive={false} fly={null} onDecide={() => {}} />
          </div>
        )}
        <SwipeCard key={current.id} profile={current} interactive fly={fly} onDecide={decide} />
      </div>

      <div className="flex items-center justify-center gap-3 pt-3 pb-1">
        <button
          type="button"
          onClick={() => decide(false)}
          aria-label="Pass on this profile"
          className="group flex h-12 min-w-32 items-center justify-center gap-2 rounded-full border border-border/70 bg-card/90 px-5 text-sm font-semibold text-foreground shadow-soft backdrop-blur-md transition-all hover:border-rose-300 hover:bg-rose-50/70 hover:text-rose-600 active:scale-[0.97]"
        >
          <X className="h-4.5 w-4.5 text-rose-500 transition-transform group-hover:rotate-12" />
          Pass
        </button>

        <button
          type="button"
          onClick={() => decide(true)}
          aria-label="Like this profile"
          className="group flex h-12 min-w-36 items-center justify-center gap-2 rounded-full bg-gradient-romantic px-6 text-sm font-semibold text-white shadow-glow-strong transition-all hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(244,63,94,0.45)] active:translate-y-0 active:scale-[0.97]"
        >
          <Heart className="h-5 w-5 fill-current transition-transform group-hover:scale-110" />
          Like
        </button>
      </div>

      {/* Full Celebration Modal */}
      {match && (
        <MatchCelebrationModal
          me={me}
          matchedProfile={match.profile}
          onSendMessage={() => navigate({ to: "/chat/$matchId", params: { matchId: match.matchId } })}
          onKeepSwiping={() => setMatch(null)}
        />
      )}
    </>
  );
}
