import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { EmberLogo } from "@/components/EmberLogo";
import { AmbientBackground } from "@/components/AmbientBackground";
import demo1 from "@/assets/demo-1.jpg";
import demo2 from "@/assets/demo-2.jpg";
import demo3 from "@/assets/demo-3.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ember — Swipe, match and chat" },
      {
        name: "description",
        content: "Join Ember to swipe through profiles, match with people you like and start a conversation.",
      },
      { property: "og:title", content: "Ember — Swipe, match and chat" },
      {
        property: "og:description",
        content: "Join Ember to swipe through profiles, match with people you like and start a conversation.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/discover", replace: true });
  }, [user, loading, navigate]);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-background px-6 pb-10 pt-10">
      <AmbientBackground intensity="vibrant" />

      <header className="flex items-center justify-between">
        <EmberLogo size="md" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          Real Connections
        </span>
      </header>

      {/* Floating 3D Cards Showcase */}
      <section className="relative my-auto flex h-84 items-center justify-center py-6" aria-hidden="true">
        {/* Left card */}
        <div className="absolute left-1 top-8 h-60 w-44 -rotate-12 rounded-[2rem] overflow-hidden border-2 border-white/60 shadow-card animate-float-reverse transition-transform">
          <img
            src={demo3}
            alt=""
            width={768}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/90 drop-shadow">
            Maya, 23
          </span>
        </div>

        {/* Right card */}
        <div className="absolute right-1 top-12 h-60 w-44 rotate-12 rounded-[2rem] overflow-hidden border-2 border-white/60 shadow-card animate-float-delayed transition-transform">
          <img
            src={demo2}
            alt=""
            width={768}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 text-xs font-semibold text-white/90 drop-shadow">
            Leo, 27
          </span>
        </div>

        {/* Center spotlight card */}
        <div className="relative z-10 h-72 w-52 rounded-[2.25rem] overflow-hidden border-4 border-white/90 shadow-glow-strong animate-float">
          <img
            src={demo1}
            alt=""
            width={768}
            height={1024}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-photo-fade" />
          
          {/* Floating heart badge */}
          <div className="absolute top-3.5 right-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-romantic text-white shadow-glow border border-white/30">
            <Heart className="h-4.5 w-4.5 fill-current animate-heartbeat" />
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="font-display text-lg font-semibold block leading-tight drop-shadow">
              Sophia, 24
            </span>
            <span className="text-xs text-white/80">Paris &bull; Design</span>
          </div>
        </div>
      </section>

      {/* Hero CTA section */}
      <section className="mt-auto space-y-3.5 text-center">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          Find your{" "}
          <span className="bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text text-transparent">
            spark
          </span>
        </h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground leading-relaxed">
          Discover genuine profiles, spark meaningful matches, and connect seamlessly.
        </p>

        <div className="space-y-3 pt-3">
          <Button
            asChild
            size="lg"
            className="group relative h-14 w-full overflow-hidden rounded-full bg-gradient-romantic text-base font-semibold shadow-glow-strong transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              <span className="relative z-10 flex items-center justify-center gap-2">
                Create account
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
              </span>
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-12 w-full rounded-full border border-border/60 bg-card/60 text-base font-medium backdrop-blur-md transition-colors hover:bg-card/90"
          >
            <Link to="/auth" search={{ mode: "signin" }}>
              I already have an account
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
