import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { ProfilePhoto } from "@/components/ProfilePhoto";
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
    <div className="px-5 pb-6 pt-8">
      <h1 className="text-3xl font-semibold">Chats</h1>

      {isLoading ? null : !rows?.length ? (
        <div className="mt-24 flex flex-col items-center gap-3 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MessageCircle className="h-9 w-9" />
          </span>
          <h2 className="text-xl font-semibold">No matches yet</h2>
          <p className="max-w-[15rem] text-sm text-muted-foreground">
            Keep swiping — when someone likes you back, they will show up here.
          </p>
          <Link to="/discover" className="mt-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            Go to Discover
          </Link>
        </div>
      ) : (
        <>
          {fresh.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">New matches</h2>
              <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-2">
                {fresh.map((r) => (
                  <Link key={r.matchId} to="/chat/$matchId" params={{ matchId: r.matchId }} className="flex w-20 flex-none flex-col items-center gap-2">
                    <ProfilePhoto path={r.other.photo_url} name={r.other.display_name} className="h-20 w-20 rounded-full border-2 border-primary" />
                    <span className="max-w-full truncate text-sm font-medium">{r.other.display_name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {chats.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">Messages</h2>
              <ul className="space-y-1">
                {chats.map((r) => (
                  <li key={r.matchId}>
                    <Link to="/chat/$matchId" params={{ matchId: r.matchId }} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-muted">
                      <ProfilePhoto path={r.other.photo_url} name={r.other.display_name} className="h-14 w-14 flex-none rounded-full" />
                      <div className="min-w-0">
                        <p className="font-semibold">{r.other.display_name}</p>
                        <p className="truncate text-sm text-muted-foreground">
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
    </div>
  );
}
