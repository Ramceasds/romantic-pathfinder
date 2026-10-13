import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmberLogo } from "@/components/EmberLogo";
import { AmbientBackground } from "@/components/AmbientBackground";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: "signin" | "signup" } => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join — Ember" },
      { name: "description", content: "Sign in or create your Ember account to start matching." },
      { property: "og:title", content: "Sign in or join — Ember" },
      { property: "og:description", content: "Sign in or create your Ember account to start matching." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const isSignup = mode === "signup";

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/discover", replace: true });
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setCheckEmail(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("Google sign-in failed");
  }

  if (checkEmail) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <AmbientBackground intensity="vibrant" />
        <div className="relative z-10 w-full rounded-3xl border border-white/60 bg-card/80 p-8 shadow-card backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-romantic text-white shadow-glow">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Tap it to
            activate your account, then come back and sign in.
          </p>
          <Button asChild variant="ghost" className="mt-6 w-full rounded-full border border-border/60 bg-card/80 text-sm">
            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setCheckEmail(false)}>
              Back to sign in
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-background px-6 pb-10 pt-6">
      <AmbientBackground intensity="vibrant" />

      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-card/80 shadow-soft backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <EmberLogo size="sm" showText={false} />
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card/75 px-3 py-2 shadow-soft backdrop-blur-md">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            <time
              dateTime={now.toISOString()}
              aria-label={`Local time ${timeLabel}, ${dateLabel}`}
              className="min-w-[5.25rem] text-right tabular-nums"
            >
              <span className="block text-xs font-semibold text-foreground">{timeLabel}</span>
              <span className="block text-[10px] leading-4 text-muted-foreground">{dateLabel}</span>
            </time>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {isSignup ? "Join Ember" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignup
            ? "Create an account to start meeting new people"
            : "Sign in to catch up with your matches"}
        </p>
      </div>

      <div className="relative z-10 rounded-[2rem] border border-white/60 bg-card/80 p-6 shadow-card backdrop-blur-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-background/80 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-background/80 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="h-13 w-full rounded-full bg-gradient-romantic text-base font-semibold text-white shadow-glow-strong transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border/60" /> or <span className="h-px flex-1 bg-border/60" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={google}
          className="h-12 w-full rounded-full border-border/60 bg-background/80 text-sm font-medium transition-all hover:bg-background hover:scale-[1.01] active:scale-[0.99]"
        >
          Continue with Google
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "signin" : "signup" }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </main>
  );
}
