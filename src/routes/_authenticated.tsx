import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Flame, MessageCircle, User } from "lucide-react";
import { useAuth, useMyProfile } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

const tabs = [
  { to: "/discover", label: "Discover", icon: Flame },
  { to: "/matches", label: "Chats", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile, isLoading: profileLoading } = useMyProfile(user?.id);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
      return;
    }
    if (!profileLoading && profile === null && pathname !== "/profile") {
      navigate({ to: "/profile", replace: true });
    }
  }, [user, loading, profile, profileLoading, pathname, navigate]);

  if (loading || !user || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <Flame className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const inChat = pathname.startsWith("/chat/");
  const hideNav = inChat || !profile;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-background shadow-card">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
      {!hideNav && (
        <nav
          className="flex border-t border-border/50 bg-card/85 backdrop-blur-xl shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.06)] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
          aria-label="Main"
        >
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-xs font-semibold transition-all duration-200",
                  active
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95",
                )}
              >
                {active && (
                  <span className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 backdrop-blur-md" />
                )}
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    active && "fill-primary/20 scale-110",
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
