import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden bg-gradient-warm px-6 pb-10 pt-10">
      <header className="flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Flame className="h-5 w-5" />
        </span>
        <span className="font-display text-2xl font-semibold">Ember</span>
      </header>

      <section className="relative my-8 h-80 flex-none" aria-hidden="true">
        <img
          src={demo3}
          alt=""
          width={768}
          height={1024}
          className="absolute left-0 top-6 h-60 w-44 -rotate-6 rounded-3xl object-cover shadow-card"
        />
        <img
          src={demo2}
          alt=""
          width={768}
          height={1024}
          className="absolute right-0 top-10 h-60 w-44 rotate-6 rounded-3xl object-cover shadow-card"
        />
        <img
          src={demo1}
          alt=""
          width={768}
          height={1024}
          className="absolute left-1/2 top-0 h-72 w-52 -translate-x-1/2 rounded-3xl border-4 border-card object-cover shadow-card"
        />
      </section>

      <section className="mt-auto space-y-3 text-center">
        <h1 className="text-4xl font-semibold leading-tight">
          Find your <span className="text-primary">spark</span>
        </h1>
        <p className="text-muted-foreground">
          Swipe through real profiles, match when it's mutual, and start the conversation.
        </p>
        <div className="space-y-3 pt-4">
          <Button asChild size="lg" className="h-14 w-full rounded-full bg-gradient-primary text-base shadow-glow">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create account
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="h-12 w-full rounded-full text-base">
            <Link to="/auth" search={{ mode: "signin" }}>
              I already have an account
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
