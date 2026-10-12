import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: "signin" | "signup" } => ({
    mode: search.mode === "signup" ? "signup" : "signin",
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
  const isSignup = mode === "signup";

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
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-gradient-warm px-6 text-center">
        <h1 className="text-3xl font-semibold">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Tap it to
          activate your account, then come back and sign in.
        </p>
        <Button asChild variant="ghost" className="mt-6">
          <Link to="/auth" search={{ mode: "signin" }} onClick={() => setCheckEmail(false)}>
            Back to sign in
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-gradient-warm px-6 pb-10 pt-6">
      <Link to="/" className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Flame className="h-5 w-5" />
        </span>
        <h1 className="text-3xl font-semibold">{isSignup ? "Join Ember" : "Welcome back"}</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-2xl bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl bg-card"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          size="lg"
          className="h-14 w-full rounded-full bg-gradient-primary text-base shadow-glow"
        >
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" size="lg" onClick={google} className="h-14 w-full rounded-full bg-card text-base">
        Continue with Google
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "signin" : "signup" }}
          className="font-semibold text-primary"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </main>
  );
}
