import { describe, expect, it } from "vitest";
import { rankCandidates, distanceKm } from "@/lib/discovery";
import type { Profile } from "@/lib/profile";

const p = (id: string, lat: number | null, lng: number | null, interests: string[]) =>
  ({ id, latitude: lat, longitude: lng, interests }) as unknown as Profile;

const me = { latitude: 51.5072, longitude: -0.1276, max_distance_km: 50, interests: ["Coffee"], filter_interests: [], sort_by_shared: true };

describe("discovery filters", () => {
  it("London to Berlin is about 930 km", () => {
    expect(Math.round(distanceKm(51.5072, -0.1276, 52.52, 13.405))).toBeGreaterThan(900);
  });
  it("excludes people beyond max distance", () => {
    const r = rankCandidates(me, [p("near", 51.5, -0.1, []), p("far", 52.52, 13.405, [])]);
    expect(r.map((x) => x.id)).toEqual(["near"]);
  });
  it("keeps only people with a chosen interest", () => {
    const r = rankCandidates({ ...me, max_distance_km: 500, filter_interests: ["books"] }, [
      p("a", 51.5, -0.1, ["Books"]),
      p("b", 51.5, -0.1, ["Golf"]),
    ]);
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });
  it("ranks more shared interests first", () => {
    const r = rankCandidates({ ...me, max_distance_km: 500 }, [p("a", null, null, []), p("b", null, null, ["coffee"])]);
    expect(r[0]!.id).toBe("b");
  });
});
