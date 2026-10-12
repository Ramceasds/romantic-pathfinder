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
        <nav className="flex border-t bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Main">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-6 w-6", active && "fill-primary/15")} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
