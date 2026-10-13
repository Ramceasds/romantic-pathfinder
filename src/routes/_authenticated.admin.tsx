import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Flag,
  Flame,
  Loader2,
  MessageSquare,
  ShieldCheck,
  StickyNote,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import type { Tables } from "@/integrations/supabase/types";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Moderation — Ember" },
      { name: "description", content: "Review reports, inspect profiles and chats, and record moderation actions." },
      { property: "og:title", content: "Moderation — Ember" },
      { property: "og:description", content: "Review reports, inspect profiles and chats, and record moderation actions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Report = Tables<"reports">;
type Action = Tables<"moderation_actions">;
type Status = "open" | "resolved" | "dismissed" | "all";

const ACTIONS = [
  { value: "dismiss", label: "Dismiss", icon: XCircle, hint: "No rule broken" },
  { value: "warn", label: "Warn", icon: AlertTriangle, hint: "Record a warning" },
  { value: "suspend", label: "Suspend", icon: Ban, hint: "Hide & stop messaging" },
  { value: "unsuspend", label: "Restore", icon: Undo2, hint: "Lift a suspension" },
  { value: "note", label: "Note", icon: StickyNote, hint: "Internal note only" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  open: "bg-accent text-primary",
  resolved: "bg-secondary text-secondary-foreground",
  dismissed: "bg-muted text-muted-foreground",
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function AdminPage() {
  const { user } = useAuth();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);

  if (isLoading) return <Centered><Flame className="h-8 w-8 animate-pulse text-primary" /></Centered>;
  if (!isAdmin) return <NoAccess />;
  return <Dashboard moderatorId={user!.id} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gradient-warm p-6 text-center">{children}</div>;
}

function NoAccess() {
  const qc = useQueryClient();
  const { data: adminExists } = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_exists");
      return !!data;
    },
  });
  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error || !data) throw new Error("no");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["is-admin"] }),
    onError: () => toast.error("Someone is already the admin"),
  });

  return (
    <Centered>
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-card text-primary shadow-card">
        <ShieldCheck className="h-8 w-8" />
      </span>
      {adminExists === false ? (
        <>
          <h1 className="text-3xl font-semibold">Set up moderation</h1>
          <p className="max-w-sm text-muted-foreground">No one manages reports yet. Become the admin with this account — only the first person can do this.</p>
          <Button size="lg" onClick={() => claim.mutate()} disabled={claim.isPending} className="rounded-full bg-gradient-primary px-8 shadow-glow">
            Become admin
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Admins only</h1>
          <p className="max-w-sm text-muted-foreground">This area is for the Ember moderation team.</p>
        </>
      )}
      <Link to="/discover" className="text-sm font-medium text-primary">Back to Ember</Link>
    </Centered>
  );
}

function Dashboard({ moderatorId }: { moderatorId: string }) {
  const [status, setStatus] = useState<Status>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  const profileIds = useMemo(() => [...new Set(reports.flatMap((r) => [r.reporter, r.reported]))], [reports]);
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles", profileIds.join(",")],
    enabled: profileIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").in("id", profileIds);
      if (error) throw error;
      return data;
    },
  });
  const byId = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const counts = {
    open: reports.filter((r) => r.status === "open").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
    all: reports.length,
  };
  const list = status === "all" ? reports : reports.filter((r) => r.status === status);
  const reportCount = (pid: string) => reports.filter((r) => r.reported === pid).length;
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-7xl flex-col">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted" aria-label="Back to app">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-xl font-semibold leading-tight">Moderation</p>
            <p className="text-xs text-muted-foreground">Ember trust & safety</p>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Stat label="Open" value={counts.open} accent />
          <Stat label="Resolved" value={counts.resolved} />
          <Stat label="Dismissed" value={counts.dismissed} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("flex w-full flex-col border-r bg-card md:w-[22rem] md:flex", selected && "hidden")}>
          <div className="flex gap-1 border-b p-2">
            {(["open", "resolved", "dismissed", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-semibold capitalize transition-colors",
                  status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {s} <span className="opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                {status === "open" ? "Inbox zero — no open reports." : "Nothing here."}
              </div>
            ) : (
              <ul>
                {list.map((r) => {
                  const p = byId.get(r.reported);
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted",
                          selectedId === r.id && "bg-accent",
                        )}
                      >
                        <ProfilePhoto path={p?.photo_url ?? null} name={p?.display_name ?? "?"} className="h-11 w-11 flex-none rounded-full" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold">{p?.display_name ?? "Deleted profile"}</p>
                            <span className="flex-none text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{r.reason}</p>
                          <div className="mt-1 flex gap-1.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-semibold capitalize", STATUS_STYLE[r.status])}>{r.status}</span>
                            {reportCount(r.reported) > 1 && (
                              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[0.7rem] font-semibold text-destructive">
                                {reportCount(r.reported)} reports
                              </span>
                            )}
                            {p?.suspended && <span className="rounded-full bg-foreground px-2 py-0.5 text-[0.7rem] font-semibold text-background">Suspended</span>}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className={cn("min-w-0 flex-1 overflow-y-auto bg-background", !selected && "hidden md:block")}>
          {selected ? (
            <ReportDetail
              key={selected.id}
              report={selected}
              reported={byId.get(selected.reported)}
              reporter={byId.get(selected.reporter)}
              priorReports={reports.filter((r) => r.reported === selected.reported && r.id !== selected.id)}
              moderatorId={moderatorId}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Flag className="h-8 w-8" />
              <p>Select a report to review it.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-1.5 text-center", accent && "border-primary bg-accent")}>
      <p className={cn("text-lg font-semibold leading-tight", accent && "text-primary")}>{value}</p>
      <p className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ReportDetail({
  report,
  reported,
  reporter,
  priorReports,
  moderatorId,
  onBack,
}: {
  report: Report;
  reported?: Profile;
  reporter?: Profile;
  priorReports: Report[];
  moderatorId: string;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [action, setAction] = useState<(typeof ACTIONS)[number]["value"]>("warn");
  const [note, setNote] = useState("");

  const { data: messages } = useQuery({
    queryKey: ["admin-messages", report.match_id],
    enabled: !!report.match_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", report.match_id!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin-actions", report.reported],
    queryFn: async (): Promise<Action[]> => {
      const { data, error } = await supabase
        .from("moderation_actions")
        .select("*")
        .eq("profile_id", report.reported)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const record = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("moderation_actions").insert({
        report_id: report.id,
        profile_id: report.reported,
        moderator: moderatorId,
        action,
        note: note.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNote("");
      toast.success("Action recorded");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-reports"] }),
        qc.invalidateQueries({ queryKey: ["admin-profiles"] }),
        qc.invalidateQueries({ queryKey: ["admin-actions", report.reported] }),
      ]);
    },
    onError: () => toast.error("Could not record action"),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-muted-foreground md:hidden">
        <ArrowLeft className="h-4 w-4" /> All reports
      </button>

      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", STATUS_STYLE[report.status])}>{report.status}</span>
          <span className="text-xs text-muted-foreground">Reported {new Date(report.created_at).toLocaleString()}</span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold">{report.reason}</h2>
        {report.details ? (
          <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-muted p-3 text-sm">“{report.details}”</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No details given.</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          From <span className="font-medium text-foreground">{reporter?.display_name ?? "a deleted profile"}</span>
          {priorReports.length > 0 && <> · {priorReports.length} other report{priorReports.length > 1 ? "s" : ""} about this person</>}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <section className="overflow-hidden rounded-3xl border bg-card shadow-soft">
          <div className="relative aspect-[4/5]">
            <ProfilePhoto path={reported?.photo_url ?? null} name={reported?.display_name ?? "?"} className="h-full w-full" />
            {reported?.suspended && (
              <span className="absolute left-3 top-3 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">Suspended</span>
            )}
          </div>
          {reported ? (
            <div className="space-y-2 p-4">
              <p className="text-xl font-semibold">{reported.display_name}, {reported.age}</p>
              <p className="text-sm text-muted-foreground">
                {reported.gender} · {reported.city || "No city"}{reported.is_demo && " · sample profile"}
              </p>
              {reported.bio && <p className="text-sm">{reported.bio}</p>}
              <div className="flex flex-wrap gap-1.5">
                {reported.interests.map((i) => (
                  <span key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{i}</span>
                ))}
              </div>
              <p className="pt-1 text-xs text-muted-foreground">Joined {new Date(reported.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">This profile was deleted.</p>
          )}
        </section>

        <section className="flex min-h-[20rem] flex-col rounded-3xl border bg-card shadow-soft">
          <p className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
            <MessageSquare className="h-4 w-4" /> Chat context
            {messages && <span className="font-normal text-muted-foreground">· {messages.length} messages</span>}
          </p>
          <div className="max-h-[28rem] flex-1 space-y-2 overflow-y-auto p-4">
            {!report.match_id ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Reported from Discover — there's no chat between them.</p>
            ) : !messages ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">They matched but never messaged.</p>
            ) : (
              messages.map((m) => {
                const fromReported = m.sender === report.reported;
                return (
                  <div key={m.id} className={cn("flex flex-col", fromReported ? "items-start" : "items-end")}>
                    <span className="mb-0.5 px-2 text-[0.7rem] text-muted-foreground">
                      {fromReported ? reported?.display_name : reporter?.display_name} · {new Date(m.created_at).toLocaleString()}
                    </span>
                    <p
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                        fromReported ? "border border-destructive/30 bg-destructive/5" : "bg-muted",
                      )}
                    >
                      {m.body}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <p className="font-semibold">Record an action</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ACTIONS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAction(a.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                action === a.value ? "border-primary bg-accent" : "hover:bg-muted",
              )}
            >
              <a.icon className={cn("h-5 w-5", action === a.value ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold">{a.label}</span>
              <span className="text-[0.7rem] leading-tight text-muted-foreground">{a.hint}</span>
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Note for the record (what you saw, why you decided)"
          className="mt-3 rounded-2xl"
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={() => record.mutate()}
            disabled={record.isPending || (action === "note" && !note.trim())}
            className={cn("rounded-full px-6", action === "suspend" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-gradient-primary shadow-glow")}
          >
            {record.isPending ? "Saving…" : `Record ${ACTIONS.find((a) => a.value === action)?.label.toLowerCase()}`}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-soft">
        <p className="font-semibold">History for {reported?.display_name ?? "this profile"}</p>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No actions yet.</p>
        ) : (
          <ol className="mt-3 space-y-3 border-l-2 border-muted pl-4">
            {history.map((h) => {
              const meta = ACTIONS.find((a) => a.value === h.action);
              return (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                  <p className="text-sm font-semibold">{meta?.label ?? h.action} <span className="font-normal text-muted-foreground">· {timeAgo(h.created_at)}</span></p>
                  {h.note && <p className="text-sm text-muted-foreground">{h.note}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
