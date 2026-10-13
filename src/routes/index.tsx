import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
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
      { title: "Ember — Meet beyond the first impression" },
      {
        name: "description",
        content: "Discover people who share your energy, make thoughtful connections, and meet at your own pace.",
      },
      { property: "og:title", content: "Ember — Meet beyond the first impression" },
      {
        property: "og:description",
        content: "Discover people who share your energy and meet at your own pace.",
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-5 sm:py-6">
          <Link to="/" aria-label="Ember home" className="transition-opacity hover:opacity-80">
            <EmberLogo size="md" />
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-5">
            <a
              href="#how-it-works"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              How it works
            </a>
            <Button
              asChild
              variant="ghost"
              className="h-10 rounded-full px-4 text-sm font-semibold text-foreground hover:bg-card/80"
            >
              <Link to="/auth" search={{ mode: "signin" }}>Sign in</Link>
            </Button>
            <Button
              asChild
              className="h-10 rounded-full bg-gradient-romantic px-4 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-strong sm:px-5"
            >
              <Link to="/auth" search={{ mode: "signup" }}>Join Ember</Link>
            </Button>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-6 py-8 sm:py-12 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 lg:py-14" aria-labelledby="hero-title">
          <div className="relative z-10 order-1 mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-3.5 py-2 text-xs font-semibold text-primary shadow-soft backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              A little spark, at your pace
            </div>

            <h1 id="hero-title" className="mx-auto max-w-2xl font-display text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:mx-0 lg:text-[4.5rem]">
              Meet beyond
              <span className="block bg-gradient-to-r from-primary via-rose-500 to-amber-500 bg-clip-text pb-2 text-transparent">
                the first impression.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
              The best connections start with the little things. Find people who share your energy, get to know their story, and see where a conversation takes you.
            </p>

            <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row lg:mx-0">
              <Button
                asChild
                size="lg"
                className="group h-13 flex-1 rounded-full bg-gradient-romantic px-6 text-base font-semibold text-white shadow-glow-strong transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Create your profile
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-13 rounded-full border-border/70 bg-card/60 px-6 text-base font-semibold backdrop-blur-md transition-colors hover:bg-card"
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:justify-start">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Profiles with personality
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                No rush to connect
              </span>
            </div>
          </div>

          <div className="relative order-2 mx-auto flex h-[23rem] w-full max-w-xl items-center justify-center sm:h-[31rem] lg:h-[35rem]" aria-label="A preview of Ember profiles">
            <div className="absolute left-[2%] top-[11%] h-48 w-32 -rotate-[10deg] overflow-hidden rounded-[1.6rem] border-2 border-white/80 shadow-card transition-transform duration-500 hover:-translate-y-2 hover:-rotate-[6deg] sm:left-[5%] sm:h-64 sm:w-44">
              <img src={demo3} alt="Maya, 23" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 left-3 text-sm font-semibold text-white drop-shadow">Maya, 23</span>
            </div>

            <div className="absolute right-[2%] top-[14%] h-48 w-32 rotate-[10deg] overflow-hidden rounded-[1.6rem] border-2 border-white/80 shadow-card transition-transform duration-500 hover:-translate-y-2 hover:rotate-[6deg] sm:right-[5%] sm:h-64 sm:w-44">
              <img src={demo2} alt="Leo, 27" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute bottom-3 right-3 text-sm font-semibold text-white drop-shadow">Leo, 27</span>
            </div>

            <div className="relative z-10 h-64 w-48 overflow-hidden rounded-[2rem] border-4 border-white/90 shadow-glow-strong transition-transform duration-500 hover:scale-[1.025] sm:h-[22rem] sm:w-60">
              <img src={demo1} alt="Sophia, 24" width={768} height={1024} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-photo-fade" />
              <div className="absolute right-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-gradient-romantic text-white shadow-glow">
                <Heart className="h-4.5 w-4.5 fill-current motion-safe:animate-heartbeat" aria-hidden="true" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="block font-display text-2xl font-semibold leading-tight drop-shadow">Sophia, 24</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-white/90">
                  <MapPin className="h-3 w-3" aria-hidden="true" /> Paris · Design
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-white/70 bg-background/85 px-4 py-2.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-xl sm:bottom-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Start with what makes you, you
            </div>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-8 border-t border-border/60 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Made for meaningful beginnings
            </span>
            <h2 id="how-title" className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Good connections start with curiosity.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              A simple way to move from a first look to a conversation that feels like yours.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-3">
            <article className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-soft backdrop-blur">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">01 · Start with you</span>
              <h3 className="mt-4 font-display text-xl font-semibold">Make your profile yours</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Share a few details, interests, and the things you hope to find in someone.
              </p>
            </article>
            <article className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-soft backdrop-blur">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">02 · Find your people</span>
              <h3 className="mt-4 font-display text-xl font-semibold">Explore at your pace</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Browse profiles, notice what sparks your interest, and choose who you’d like to meet.
              </p>
            </article>
            <article className="rounded-3xl border border-border/70 bg-card/75 p-6 shadow-soft backdrop-blur">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">03 · See what unfolds</span>
              <h3 className="mt-4 font-display text-xl font-semibold">Let conversation begin</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                When the feeling is mutual, say hello and discover what you have in common.
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="closing-title" className="mb-10 flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-primary/10 bg-gradient-warm p-7 text-center shadow-soft sm:mb-14 sm:flex-row sm:p-10 sm:text-left">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Your profile, your pace, your choice
            </span>
            <h2 id="closing-title" className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Make space for a real connection.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Start with a little curiosity. You decide what happens next.
            </p>
          </div>
          <Button asChild size="lg" className="group h-13 shrink-0 rounded-full bg-gradient-romantic px-7 text-base font-semibold text-white shadow-glow-strong transition-all hover:-translate-y-0.5 hover:shadow-xl">
            <Link to="/auth" search={{ mode: "signup" }}>
              Find your spark
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </section>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border/60 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <EmberLogo size="sm" />
          <span>Be kind, stay curious.</span>
          <Link to="/auth" search={{ mode: "signin" }} className="font-medium transition-colors hover:text-foreground">
            Sign in to Ember
          </Link>
        </footer>
      </div>
    </main>
  );
}
