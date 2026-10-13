import type { Profile } from "@/lib/profile";

/** Distance slider value at/above which distance is not limited. */
export const ANY_DISTANCE_KM = 500;

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function sharedInterests(a: string[], b: string[]): string[] {
  const set = new Set(a.map((i) => i.toLowerCase()));
  return b.filter((i) => set.has(i.toLowerCase()));
}

export type Candidate = Profile & { distance: number | null; shared: string[] };

type Me = Pick<Profile, "latitude" | "longitude" | "max_distance_km" | "interests" | "filter_interests" | "sort_by_shared">;

/** Applies distance + interest filters and ranks the deck. */
export function rankCandidates(me: Me, profiles: Profile[]): Candidate[] {
  const hasLoc = me.latitude != null && me.longitude != null;
  const limit = hasLoc && me.max_distance_km < ANY_DISTANCE_KM ? me.max_distance_km : null;
  const wanted = me.filter_interests.map((i) => i.toLowerCase());

  const out: Candidate[] = [];
  for (const p of profiles) {
    const distance =
      hasLoc && p.latitude != null && p.longitude != null
        ? distanceKm(me.latitude!, me.longitude!, p.latitude, p.longitude)
        : null;
    if (limit != null && (distance == null || distance > limit)) continue;
    if (wanted.length && !p.interests.some((i) => wanted.includes(i.toLowerCase()))) continue;
    out.push({ ...p, distance, shared: sharedInterests(me.interests, p.interests) });
  }
  if (me.sort_by_shared) {
    out.sort((a, b) => b.shared.length - a.shared.length || (a.distance ?? 1e9) - (b.distance ?? 1e9));
  } else if (hasLoc) {
    out.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  }
  return out;
}

export function formatDistance(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return "Less than 1 km away";
  return `${Math.round(km)} km away`;
}
