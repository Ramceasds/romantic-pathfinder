import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { SafetyMenu } from "@/components/SafetyMenu";
import { OpenerAssistant } from "@/components/OpenerAssistant";
import { sharedInterests } from "@/lib/discovery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$matchId")({
  head: () => ({
    meta: [
      { title: "Chat — Ember" },
      { name: "description", content: "Chat with your match on Ember." },
      { property: "og:title", content: "Chat — Ember" },
      { property: "og:description", content: "Chat with your match on Ember." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { matchId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: me } = useMyProfile(user?.id);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [ideasOpen, setIdeasOpen] = useState<boolean | null>(null);

  const { data: blockedIds = [] } = useQuery({
    queryKey: ["blocked-ids"],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("blocked_profile_ids");
      if (error) throw error;
      return (data as string[] | null) ?? [];
    },
  });

  const { data: other } = useQuery({
    queryKey: ["chat-other", matchId, me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data: m, error } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (error) throw error;
      const otherId = m.profile_a === me!.id ? m.profile_b : m.profile_a;
      const { data, error: e2 } = await supabase.from("profiles").select("*").eq("id", otherId).single();
      if (e2) throw e2;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", matchId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, qc]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !me || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ match_id: matchId, sender: me.id, body });
    setSending(false);
    if (error) {
      toast.error("Message not sent");
      return;
    }
    setText("");
    await qc.invalidateQueries({ queryKey: ["messages", matchId] });
    qc.invalidateQueries({ queryKey: ["matches"] });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b bg-card px-3 py-3">
        <Link to="/matches" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted" aria-label="Back to chats">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {other && (
          <>
            <ProfilePhoto path={other.photo_url} name={other.display_name} className="h-10 w-10 rounded-full" />
            <div>
              <p className="font-semibold leading-tight">{other.display_name}</p>
              <p className="text-xs text-muted-foreground">{other.city}</p>
            </div>
          </>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages?.length === 0 && other && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            You matched with {other.display_name}. Say hi and break the ice!
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.sender === me?.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[78%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-[0.95rem]",
                  mine
                    ? "rounded-br-md bg-gradient-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-secondary-foreground",
                )}
              >
                {m.body}
              </p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="h-12 min-w-0 flex-1 rounded-full border bg-background px-5 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          aria-label="Send"
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-opacity disabled:opacity-50"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
