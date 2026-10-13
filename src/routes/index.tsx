import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Heart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
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
      { title: "Ember — Find your spark" },
      {
        name: "description",
        content: "Discover genuine profiles, meaningful matches and conversations worth having.",
      },
      { property: "og:title", content: "Ember — Find your spark" },
      {
        property: "og:description",
        content: "Discover genuine profiles, meaningful matches and conversations worth having.",
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
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <AmbientBackground intensity="vibrant" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <header className="flex items-center justify-between">
          <Link to="/" aria-label="Ember home" className="transition-opacity hover:opacity-80">
            <EmberLogo size="md" />
          </Link>
          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-md sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Designed for genuine connections
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-12">
          <section className="order-2 text-center lg:order-1 lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Real people. Real sparks.
            </div>

            <h1 className="mx-auto max-w-xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:mx-0 lg:text-7xl">
              Your next
              <span className="block bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text pb-2 text-transparent">
                great connection.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
              Discover people who share your energy, explore profiles that feel authentic,
              and turn a little curiosity into something meaningful.
            </p>

            <div className="mx-auto mt-8 max-w-md space-y-3 lg:mx-0">
              <Button
                asChild
                size="lg"
                className="group h-14 w-full rounded-full bg-gradient-romantic text-base font-semibold shadow-glow-strong transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl active:translate-y-0"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start discovering
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 w-full rounded-full border border-border/60 bg-card/50 text-base font-medium backdrop-blur-md transition-all hover:bg-card/90"
              >
                <Link to="/auth" search={{ mode: "signin" }}>I already have an account</Link>
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Built for meaningful matches</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Discover nearby</span>
            </div>
          </section>

          <section className="order-1 relative mx-auto flex h-[24rem] w-full max-w-xl items-center justify-center sm:h-[31rem] lg:order-2" aria-label="Example profiles">
            <div className="absolute left-[4%] top-[14%] h-52 w-36 -rotate-[11deg] overflow-hidden rounded-[1.75rem] border-2 border-white/70 shadow-card transition-transform duration-500 hover:-translate-y-2 hover:-rotate-[7deg] sm:h-64 sm:w-44">
              <img src={demo3} alt="Example profile" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-xs font-semibold text-white drop-shadow">Maya, 23</span>
            </div>

            <div className="absolute right-[4%] top-[18%] h-52 w-36 rotate-[11deg] overflow-hidden rounded-[1.75rem] border-2 border-white/70 shadow-card transition-transform duration-500 hover:-translate-y-2 hover:rotate-[7deg] sm:h-64 sm:w-44">
              <img src={demo2} alt="Example profile" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <span className="absolute bottom-3 right-3 text-xs font-semibold text-white drop-shadow">Leo, 27</span>
            </div>

            <div className="relative z-10 h-64 w-48 overflow-hidden rounded-[2.25rem] border-4 border-white/90 shadow-glow-strong transition-transform duration-500 hover:scale-[1.025] sm:h-80 sm:w-56">
              <img src={demo1} alt="Example profile" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-photo-fade" />
              <div className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-gradient-romantic text-white shadow-glow">
                <Heart className="h-4.5 w-4.5 fill-current animate-heartbeat" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="block font-display text-xl font-semibold leading-tight drop-shadow">Sophia, 24</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-white/85"><MapPin className="h-3 w-3" /> Paris · Design</span>
              </div>
            </div>

            <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/60 bg-background/75 px-4 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-xl">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              New people are joining every day
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-center pb-1 text-center text-[11px] text-muted-foreground/80">
          Your profile, your pace, your choice. &nbsp;·&nbsp; Be kind, stay curious.
        </footer>
      </div>
    </main>
  );
}
