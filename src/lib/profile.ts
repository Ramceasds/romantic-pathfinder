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
