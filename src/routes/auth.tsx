import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmberLogo } from "@/components/EmberLogo";
import { AmbientBackground } from "@/components/AmbientBackground";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";

type AuthMode = "signin" | "signup" | "reset" | "new-password";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: AuthMode } => ({
    mode:
      search["mode"] === "signup" ||
      search["mode"] === "reset" ||
      search["mode"] === "new-password"
        ? search["mode"]
        : "signin",
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailNotice, setEmailNotice] = useState<"signup" | "reset" | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const isSignup = mode === "signup";
  const isResetRequest = mode === "reset";
  const isNewPassword = mode === "new-password";

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
  const timeZoneLabel =
    new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "Local";
  const hourAngle = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5;
  const minuteAngle = now.getMinutes() * 6 + now.getSeconds() * 0.1;
  const secondAngle = now.getSeconds() * 6;

  useEffect(() => {
    if (!loading && user && !isNewPassword) navigate({ to: "/discover", replace: true });
  }, [user, loading, isNewPassword, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (isResetRequest) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=new-password`,
        });
        if (error) throw error;
        setEmailNotice("reset");
        return;
      }

      if (isNewPassword) {
        if (password !== confirmPassword) {
          toast.error("Your passwords don’t match");
          return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPasswordUpdated(true);
        return;
      }

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setEmailNotice("signup");
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

  if (emailNotice) {
    const isResetNotice = emailNotice === "reset";
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <AmbientBackground intensity="vibrant" />
        <div className="relative z-10 w-full rounded-3xl border border-white/60 bg-card/80 p-8 shadow-card backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-romantic text-white shadow-glow">
            {isResetNotice ? <KeyRound className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {isResetNotice ? "Check your inbox" : "Check your email"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {isResetNotice ? (
              <>
                If an Ember account uses <strong className="text-foreground">{email}</strong>, we’ll send a secure password reset link.
              </>
            ) : (
              <>
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open it to activate your account, then come back and sign in.
              </>
            )}
          </p>
          <Button asChild variant="ghost" className="mt-6 h-12 w-full rounded-full border border-border/60 bg-card/80 text-sm">
            <Link to="/auth" search={{ mode: "signin" }} onClick={() => setEmailNotice(null)}>
              Back to sign in
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  if (passwordUpdated) {
    return (
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <AmbientBackground intensity="vibrant" />
        <div className="relative z-10 w-full rounded-3xl border border-white/60 bg-card/80 p-8 shadow-card backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Password updated</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your new password is ready. Continue to Ember and pick up where you left off.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/discover", replace: true })}
            className="mt-6 h-12 w-full rounded-full bg-gradient-romantic text-base font-semibold text-white shadow-glow-strong"
          >
            Continue to Ember <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    );
  }

  const heading = isSignup
    ? "Join Ember"
    : isResetRequest
      ? "Reset your password"
      : isNewPassword
        ? "Choose a new password"
        : "Welcome back";
  const description = isSignup
    ? "Create an account to start meeting new people"
    : isResetRequest
      ? "We’ll email you a secure link to choose a new password."
      : isNewPassword
        ? "Choose a new password for your Ember account."
        : "Sign in to catch up with your matches";

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-background px-6 pb-10 pt-6">
      <AmbientBackground intensity="vibrant" />

      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-card/80 shadow-soft backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <EmberLogo size="sm" showText={false} />
          <div className="flex items-center gap-2.5 rounded-[1.35rem] border border-white/80 bg-gradient-to-br from-white/95 via-card/85 to-primary/10 px-2.5 py-2 shadow-[0_8px_22px_-12px_oklch(0.58_0.18_22_/_0.4)] ring-1 ring-primary/10 backdrop-blur-xl">
            <div
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/90 bg-gradient-to-br from-rose-50 via-white to-amber-100 shadow-[inset_0_1px_4px_rgba(255,255,255,0.95),0_3px_10px_rgba(232,93,105,0.16)]"
              aria-hidden="true"
            >
              <span className="absolute inset-[4px] rounded-full border border-rose-200/80" />
              <div
                className="absolute inset-0"
                style={{ transform: `rotate(${hourAngle}deg)`, transition: "transform 600ms linear" }}
              >
                <span className="absolute left-1/2 top-1/2 h-[10px] w-[2px] -translate-x-1/2 -translate-y-full rounded-full bg-foreground/80" />
              </div>
              <div
                className="absolute inset-0"
                style={{ transform: `rotate(${minuteAngle}deg)`, transition: "transform 600ms linear" }}
              >
                <span className="absolute left-1/2 top-1/2 h-[14px] w-[1.5px] -translate-x-1/2 -translate-y-full rounded-full bg-primary" />
              </div>
              <div
                className="absolute inset-0"
                style={{ transform: `rotate(${secondAngle}deg)`, transition: "transform 600ms linear" }}
              >
                <span className="absolute left-1/2 top-1/2 h-[16px] w-px -translate-x-1/2 -translate-y-full rounded-full bg-rose-500" />
              </div>
              <span className="relative h-1.5 w-1.5 rounded-full border border-white bg-rose-500 shadow-sm" />
            </div>
            <time
              dateTime={now.toISOString()}
              aria-label={`Local time ${timeLabel}, ${dateLabel}, ${timeZoneLabel}`}
              className="min-w-[5.5rem] text-right tabular-nums"
            >
              <span className="block text-xs font-bold tracking-tight text-foreground">{timeLabel}</span>
              <span className="block text-[10px] font-medium leading-4 text-muted-foreground">
                {dateLabel} <span aria-hidden="true">·</span> {timeZoneLabel}
              </span>
            </time>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="relative z-10 rounded-[2rem] border border-white/60 bg-card/80 p-6 shadow-card backdrop-blur-xl">
        <form onSubmit={onSubmit} className="space-y-4">
          {!isNewPassword && (
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
          )}

          {!isResetRequest && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {isNewPassword ? "New password" : "Password"}
                  </Label>
                  {!isSignup && !isNewPassword && (
                    <Link
                      to="/auth"
                      search={{ mode: "reset" }}
                      className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={isSignup || isNewPassword ? "new-password" : "current-password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-background/80 pr-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-2 inline-flex h-12 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isNewPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Enter your new password again"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-2xl border-border/60 bg-background/80 pr-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((shown) => !shown)}
                      aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-2 inline-flex h-12 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            disabled={busy}
            size="lg"
            className="h-13 w-full rounded-full bg-gradient-romantic text-base font-semibold text-white shadow-glow-strong transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            {busy
              ? isResetRequest
                ? "Sending link…"
                : isNewPassword
                  ? "Updating password…"
                  : "Please wait…"
              : isResetRequest
                ? "Send reset link"
                : isNewPassword
                  ? "Update password"
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
          </Button>
        </form>

        {!isResetRequest && !isNewPassword && (
          <>
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
          </>
        )}
      </div>

      {!isNewPassword && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isResetRequest ? "Remember your password?" : isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link
            to="/auth"
            search={{ mode: isSignup || isResetRequest ? "signin" : "signup" }}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : isResetRequest ? "Back to sign in" : "Create an account"}
          </Link>
        </p>
      )}
    </main>
  );
}
