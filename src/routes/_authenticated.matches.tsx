import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { AmbientBackground } from "@/components/AmbientBackground";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import type { Profile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "Chats — Ember" },
      { name: "description", content: "Your matches and conversations on Ember." },
      { property: "og:title", content: "Chats — Ember" },
      { property: "og:description", content: "Your matches and conversations on Ember." },
    ],
  }),
  component: MatchesPage,
});

type Row = {
  matchId: string;
  other: Profile;
  last: { body: string; sender: string; created_at: string } | null;
  createdAt: string;
};

function MatchesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyProfile(user?.id);
  const { isSubscribed } = useSubscription();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["matches", me?.id],
    enabled: !!me,
    queryFn: async (): Promise<Row[]> => {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!matches.length) return [];
      const otherIds = matches.map((m) => (m.profile_a === me!.id ? m.profile_b : m.profile_a));
      const [{ data: profs }, { data: msgs }] = await Promise.all([
        supabase.from("profiles").select("*").in("id", otherIds),
        supabase
          .from("messages")
          .select("match_id, body, sender, created_at")
          .in("match_id", matches.map((m) => m.id))
          .order("created_at", { ascending: false })
          .limit(300),
      ]);
      return matches.map((m) => {
        const otherId = m.profile_a === me!.id ? m.profile_b : m.profile_a;
        return {
          matchId: m.id,
          other: profs!.find((p) => p.id === otherId)!,
          last: msgs?.find((x) => x.match_id === m.id) ?? null,
          createdAt: m.created_at,
        };
      });
    },
  });

  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel("matches-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () =>
        qc.invalidateQueries({ queryKey: ["matches"] }),
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, () =>
        qc.invalidateQueries({ queryKey: ["matches"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, qc]);

  const fresh = (rows ?? []).filter((r) => !r.last);
  const chats = (rows ?? [])
    .filter((r) => r.last)
    .sort((a, b) => b.last!.created_at.localeCompare(a.last!.created_at));

  return (
    <div className="relative min-h-full px-5 pb-8 pt-6 overflow-hidden">
      <AmbientBackground intensity="subtle" />

      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Chats & Matches
      </h1>

      {isLoading ? null : !rows?.length ? (
        <div className="mt-20 flex flex-col items-center gap-3 text-center px-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-24 w-24 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-primary/25 bg-gradient-to-tr from-primary/10 via-rose-500/15 to-amber-400/10 text-primary shadow-soft backdrop-blur-md">
              <MessageCircle className="h-9 w-9" />
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">No matches yet</h2>
          <p className="max-w-[16rem] text-sm text-muted-foreground leading-relaxed">
            Keep discovering profiles — when mutual interest sparks, your conversations will appear here.
          </p>
          <Link
            to="/discover"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-romantic px-6 py-3 text-sm font-semibold text-white shadow-glow-strong transition-transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="h-4 w-4" />
            Discover people
          </Link>
        </div>
      ) : (
        <>
          {/* Secret Admirers Gold Teaser Banner */}
          <div
            onClick={() => setSubscriptionModalOpen(true)}
            className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/10 p-3.5 shadow-soft transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-full border-2 border-amber-400 bg-amber-500/20 shadow-glow">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-foreground">Secret Admirers</h3>
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                    GOLD
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-0.5">
                  {isSubscribed
                    ? "See everyone who liked your profile"
                    : "See who liked you with Ember Gold"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3 text-xs font-bold text-white shadow-sm flex-none"
            >
              {isSubscribed ? "View" : "Unlock"}
            </Button>
          </div>

          {fresh.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">
                New matches ({fresh.length})
              </h2>
              <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3 pt-1 no-scrollbar">
                {fresh.map((r) => (
                  <Link
                    key={r.matchId}
                    to="/chat/$matchId"
                    params={{ matchId: r.matchId }}
                    className="group flex w-20 flex-none flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="rounded-full p-[2.5px] bg-gradient-to-tr from-rose-500 via-primary to-amber-400 shadow-glow transition-all duration-300 group-hover:shadow-glow-strong">
                      <ProfilePhoto
                        path={r.other.photo_url}
                        name={r.other.display_name}
                        className="h-18 w-18 rounded-full border-2 border-background object-cover"
                      />
                    </div>
                    <span className="max-w-full truncate text-xs font-semibold text-foreground/90">
                      {r.other.display_name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {chats.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent conversations
              </h2>
              <ul className="space-y-2">
                {chats.map((r) => (
                  <li key={r.matchId}>
                    <Link
                      to="/chat/$matchId"
                      params={{ matchId: r.matchId }}
                      className="group flex items-center gap-3.5 rounded-2xl border border-border/40 bg-card/60 p-3 shadow-soft backdrop-blur-md transition-all duration-200 hover:border-primary/30 hover:bg-card/90 hover:shadow-md"
                    >
                      <div className="relative flex-none">
                        <ProfilePhoto
                          path={r.other.photo_url}
                          name={r.other.display_name}
                          className="h-14 w-14 rounded-full border border-border/60 object-cover"
                        />
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {r.other.display_name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground pt-0.5">
                          {r.last!.sender === me?.id ? "You: " : ""}
                          {r.last!.body}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Subscription Mode Paywall Modal */}
      <SubscriptionModal
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />
    </div>
  );
}
