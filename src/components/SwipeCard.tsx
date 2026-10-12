import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
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
  const rotate = effectiveDx / 18;
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
        transition: dragging ? "none" : "transform 0.3s ease-out",
        touchAction: "pan-y",
      }}
      className={cn(
        "absolute inset-0 select-none overflow-hidden rounded-[2rem] bg-card shadow-card",
        interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
      )}
    >
      <ProfilePhoto path={profile.photo_url} name={profile.display_name} className="h-full w-full" />
      <div className="absolute inset-0 bg-photo-fade" />

      <span
        style={{ opacity: likeOpacity }}
        className="absolute left-6 top-8 -rotate-12 rounded-xl border-4 border-like px-3 py-1 font-display text-3xl font-bold uppercase tracking-wider text-like"
      >
        Like
      </span>
      <span
        style={{ opacity: passOpacity }}
        className="absolute right-6 top-8 rotate-12 rounded-xl border-4 border-pass px-3 py-1 font-display text-3xl font-bold uppercase tracking-wider text-pass"
      >
        Nope
      </span>

      <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-primary-foreground">
        <h2 className="font-display text-3xl font-semibold">
          {profile.display_name}, {profile.age}
        </h2>
        {profile.city && (
          <p className="flex items-center gap-1 text-sm opacity-90">
            <MapPin className="h-4 w-4" /> {profile.city}
          </p>
        )}
        {profile.bio && <p className="line-clamp-2 text-sm opacity-95">{profile.bio}</p>}
        {profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {profile.interests.slice(0, 4).map((i) => (
              <span key={i} className="rounded-full bg-card/25 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {i}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
