import type { Tables } from "@/integrations/supabase/types";
import demo1 from "@/assets/demo-1.jpg";
import demo2 from "@/assets/demo-2.jpg";
import demo3 from "@/assets/demo-3.jpg";
import demo4 from "@/assets/demo-4.jpg";
import demo5 from "@/assets/demo-5.jpg";
import demo6 from "@/assets/demo-6.jpg";

export type Profile = Tables<"profiles">;

export const DEMO_PHOTOS: Record<string, string> = {
  "demo:1": demo1,
  "demo:2": demo2,
  "demo:3": demo3,
  "demo:4": demo4,
  "demo:5": demo5,
  "demo:6": demo6,
};

export const GENDERS = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
] as const;

export const INTERESTED_IN = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "everyone", label: "Everyone" },
] as const;

export const POPULAR_INTEREST_CATEGORIES = [
  {
    category: "🎨 Creativity & Arts",
    items: ["Photography", "Art", "Design", "Writing", "Live Music", "Architecture", "Cinema"],
  },
  {
    category: "🏃 Active & Outdoors",
    items: ["Hiking", "Running", "Gym & Fitness", "Yoga", "Surfing", "Climbing", "Cycling"],
  },
  {
    category: "☕ Food & Social",
    items: ["Coffee", "Cooking", "Wine", "Street Food", "Baking", "Cocktails", "Brunch"],
  },
  {
    category: "✈️ Lifestyle & Fun",
    items: ["Travel", "Reading", "Board Games", "Dogs", "Cats", "Road Trips", "Museums"],
  },
  {
    category: "🎮 Tech & Geek",
    items: ["Gaming", "Podcasts", "Sci-Fi", "Anime", "Startups", "Vinyl Records"],
  },
] as const;

export const BIO_PROMPTS = [
  "My ideal Sunday looks like...",
  "The fastest way to my heart is...",
  "A non-negotiable for me is...",
  "Unpopular opinion:",
  "Together, we could...",
  "My simple pleasures in life are...",
] as const;

export function calculateProfileStrength(profile: {
  photo_url?: string | null;
  display_name?: string;
  age?: number | string;
  bio?: string;
  city?: string;
  interests?: string[];
}): { percentage: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];

  if (profile.photo_url) {
    score += 30;
  } else {
    tips.push("Add a profile photo (+30%)");
  }

  if (profile.bio && profile.bio.trim().length >= 20) {
    score += 25;
  } else {
    tips.push("Write a bio with at least 20 characters (+25%)");
  }

  const interestCount = profile.interests?.length ?? 0;
  if (interestCount >= 3) {
    score += 20;
  } else {
    tips.push(`Select at least 3 interests (${interestCount}/3) (+20%)`);
  }

  if (profile.city && profile.city.trim().length > 0) {
    score += 15;
  } else {
    tips.push("Add your location/city (+15%)");
  }

  if (profile.display_name && profile.age) {
    score += 10;
  }

  return {
    percentage: Math.min(100, score),
    tips,
  };
}

/** Genders a user wants to see, based on their "show me" preference. */
export function gendersFor(interestedIn: string): string[] {
  if (interestedIn === "women") return ["woman"];
  if (interestedIn === "men") return ["man"];
  return ["woman", "man", "nonbinary"];
}

export function parseInterests(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
}

