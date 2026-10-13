import { Sparkles, Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import type { Profile } from "@/lib/profile";

interface MatchCelebrationModalProps {
  me: Profile;
  matchedProfile: Profile;
  onSendMessage: () => void;
  onKeepSwiping: () => void;
}

export function MatchCelebrationModal({
  me,
  matchedProfile,
  onSendMessage,
  onKeepSwiping,
}: MatchCelebrationModalProps) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-rose-950/90 via-black/95 to-black/95 px-8 text-center text-white backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
      {/* Decorative ambient glowing orbs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-rose-500/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-amber-500/25 blur-3xl animate-pulse" />

      {/* Floating decorative confetti particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Sparkles className="absolute top-16 left-12 h-6 w-6 text-amber-300/80 animate-float" />
        <Heart className="absolute top-28 right-12 h-5 w-5 text-rose-400/70 fill-current animate-float-reverse" />
        <Sparkles className="absolute bottom-40 left-16 h-5 w-5 text-rose-300/60 animate-float-delayed" />
        <Heart className="absolute bottom-52 right-14 h-4 w-4 text-amber-300/60 fill-current animate-float" />
      </div>

      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/20 px-3.5 py-1 text-xs font-semibold text-rose-200 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Mutual Spark
        </div>
        <h2 className="font-display text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-200 via-white to-amber-200 bg-clip-text text-transparent drop-shadow-md">
          It's a Match!
        </h2>
        <p className="mx-auto max-w-xs text-sm text-white/80 leading-relaxed">
          You and <strong className="text-white font-semibold">{matchedProfile.display_name}</strong> both liked each other.
        </p>
      </div>

      {/* Overlapping Avatars with Radiant Pulse Rings */}
      <div className="relative my-8 flex items-center justify-center">
        {/* Glow halo behind avatars */}
        <div className="absolute h-40 w-56 rounded-full bg-rose-500/30 blur-2xl animate-match-ring" />

        {/* User photo */}
        <div className="relative z-10 -rotate-6 transition-transform">
          <div className="rounded-full p-1 bg-gradient-to-tr from-rose-500 to-amber-400 shadow-glow-strong">
            <ProfilePhoto
              path={me.photo_url}
              name={me.display_name}
              className="h-28 w-28 rounded-full border-2 border-black object-cover"
            />
          </div>
        </div>

        {/* Matched profile photo */}
        <div className="relative z-10 -ml-7 rotate-6 transition-transform">
          <div className="rounded-full p-1 bg-gradient-to-tr from-amber-400 to-rose-500 shadow-glow-strong">
            <ProfilePhoto
              path={matchedProfile.photo_url}
              name={matchedProfile.display_name}
              className="h-28 w-28 rounded-full border-2 border-black object-cover"
            />
          </div>
        </div>

        {/* Floating Heart connector in center */}
        <div className="absolute z-20 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-romantic text-white shadow-glow border-2 border-white animate-heartbeat">
          <Heart className="h-5 w-5 fill-current" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 w-full space-y-3 pt-2">
        <Button
          size="lg"
          className="group relative h-14 w-full overflow-hidden rounded-full bg-gradient-romantic text-base font-semibold text-white shadow-glow-strong transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          onClick={onSendMessage}
        >
          <span className="flex items-center justify-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Send a message
          </span>
        </Button>

        <Button
          size="lg"
          variant="ghost"
          className="h-12 w-full rounded-full border border-white/20 bg-white/10 text-base font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
          onClick={onKeepSwiping}
        >
          Keep swiping
        </Button>
      </div>
    </div>
  );
}
