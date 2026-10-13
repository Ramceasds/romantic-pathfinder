import { useRef, useState } from "react";
import { MapPin, CheckCircle2, Heart, X } from "lucide-react";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type Props = {
  profile: Profile;
  interactive: boolean;
  /** Set by the parent when a swipe is triggered by a button. */
  fly: "like" | "pass" | null;
  onDecide: (liked: boolean) => void;
};

const THRESHOLD = 90;

export function SwipeCard({ profile, interactive, fly, onDecide }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  const effectiveDx = fly === "like" ? 500 : fly === "pass" ? -500 : dx;
  const rotate = effectiveDx / 16;
  const likeOpacity = Math.max(0, Math.min(1, effectiveDx / THRESHOLD));
  const passOpacity = Math.max(0, Math.min(1, -effectiveDx / THRESHOLD));

  function down(e: React.PointerEvent) {
    if (!interactive || fly) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!dragging) return;
    setDx(e.clientX - startX.current);
  }
  function up() {
    if (!dragging) return;
    setDragging(false);
    if (dx > THRESHOLD) onDecide(true);
    else if (dx < -THRESHOLD) onDecide(false);
    else setDx(0);
  }

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      style={{
        transform: `translateX(${effectiveDx}px) rotate(${rotate}deg)`,
        transition: dragging ? "none" : "transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.15)",
        touchAction: "pan-y",
      }}
      className={cn(
        "absolute inset-0 select-none overflow-hidden rounded-[2.25rem] bg-card border border-white/60 shadow-[0_20px_45px_-12px_rgba(230,60,90,0.25)] transition-shadow",
        interactive ? "cursor-grab active:cursor-grabbing hover:shadow-[0_25px_50px_-10px_rgba(230,60,90,0.35)]" : "pointer-events-none",
      )}
    >
      <ProfilePhoto path={profile.photo_url} name={profile.display_name} className="h-full w-full object-cover" />
      
      {/* High-contrast smooth scrim gradient */}
      <div className="absolute inset-0 bg-photo-fade pointer-events-none" />

      {/* LIKE Stamp */}
      <div
        style={{ opacity: likeOpacity, transform: `scale(${0.8 + likeOpacity * 0.2}) rotate(-14deg)` }}
        className="absolute left-6 top-8 pointer-events-none z-20 flex items-center gap-1.5 rounded-2xl border-4 border-like bg-black/35 px-4 py-1.5 font-display text-3xl font-extrabold uppercase tracking-wider text-like shadow-[0_0_25px_oklch(0.72_0.17_155_/_0.75)] backdrop-blur-md"
      >
        <Heart className="h-7 w-7 fill-current" />
        <span>LIKE</span>
      </div>

      {/* NOPE Stamp */}
      <div
        style={{ opacity: passOpacity, transform: `scale(${0.8 + passOpacity * 0.2}) rotate(14deg)` }}
        className="absolute right-6 top-8 pointer-events-none z-20 flex items-center gap-1.5 rounded-2xl border-4 border-pass bg-black/35 px-4 py-1.5 font-display text-3xl font-extrabold uppercase tracking-wider text-pass shadow-[0_0_25px_oklch(0.62_0.2_22_/_0.75)] backdrop-blur-md"
      >
        <X className="h-7 w-7 stroke-[3.5]" />
        <span>NOPE</span>
      </div>

      {/* Profile Info Overlay */}
      <div className="absolute inset-x-0 bottom-0 space-y-2.5 p-6 text-white pointer-events-none">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-3xl font-bold tracking-tight drop-shadow-md">
            {profile.display_name}, <span className="font-normal opacity-95">{profile.age}</span>
          </h2>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-sm" title="Verified Profile">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>

        {profile.city && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white/95 backdrop-blur-md border border-white/15">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{profile.city}</span>
          </div>
        )}

        {profile.bio && (
          <p className="line-clamp-2 text-sm text-white/90 drop-shadow leading-relaxed font-normal">
            {profile.bio}
          </p>
        )}

        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.interests.slice(0, 4).map((i) => (
              <span
                key={i}
                className="rounded-full bg-white/20 border border-white/25 px-3 py-1 text-xs font-medium text-white backdrop-blur-md shadow-sm"
              >
                {i}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
