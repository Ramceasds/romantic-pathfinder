import { useState, useEffect } from "react";

export type SubscriptionPlan = "weekly" | "monthly" | "yearly";

export interface SubscriptionState {
  plan: SubscriptionPlan | "free";
  isSubscribed: boolean;
  expiresAt: string | null;
  autoRenew: boolean;
}

export const SUBSCRIPTION_PLANS = [
  {
    id: "weekly" as const,
    name: "Weekly",
    price: "$4.99",
    period: "/ week",
    billed: "Billed weekly",
    savings: null,
    popular: false,
    bestValue: false,
    perWeekEquivalent: "$4.99",
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "$14.99",
    period: "/ month",
    billed: "Billed monthly ($3.75/wk)",
    savings: "SAVE 25%",
    popular: true,
    bestValue: false,
    perWeekEquivalent: "$3.75",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "$69.99",
    period: "/ year",
    billed: "Billed annually ($1.35/wk)",
    savings: "SAVE 70%",
    popular: false,
    bestValue: true,
    perWeekEquivalent: "$1.35",
  },
] as const;

export const PREMIUM_FEATURES = [
  {
    title: "Unlimited Likes",
    description: "Swipe right as much as you want without daily limits",
    icon: "Infinity",
  },
  {
    title: "See Who Liked You",
    description: "Reveal secret admirers before you swipe and match instantly",
    icon: "Eye",
  },
  {
    title: "Unlimited Rewinds",
    description: "Accidentally passed on someone special? Bring them back anytime",
    icon: "RotateCcw",
  },
  {
    title: "5 Free Super Likes Weekly",
    description: "Stand out with a 3x higher match rate using Super Likes",
    icon: "Sparkles",
  },
  {
    title: "Passport Anywhere",
    description: "Teleport your location to meet people in any city worldwide",
    icon: "Globe",
  },
  {
    title: "Monthly Profile Boost",
    description: "Be the top profile in your area for 30 minutes every month",
    icon: "Zap",
  },
] as const;

const STORAGE_KEY = "ember_subscription_state";

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>(() => {
    if (typeof window === "undefined") {
      return { plan: "free", isSubscribed: false, expiresAt: null, autoRenew: false };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return { plan: "free", isSubscribed: false, expiresAt: null, autoRenew: false };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  function subscribe(plan: SubscriptionPlan) {
    const daysToAdd = plan === "weekly" ? 7 : plan === "monthly" ? 30 : 365;
    const expires = new Date();
    expires.setDate(expires.getDate() + daysToAdd);

    setState({
      plan,
      isSubscribed: true,
      expiresAt: expires.toISOString(),
      autoRenew: true,
    });
  }

  function cancelSubscription() {
    setState({
      plan: "free",
      isSubscribed: false,
      expiresAt: null,
      autoRenew: false,
    });
  }

  const activePlanDetails = SUBSCRIPTION_PLANS.find((p) => p.id === state.plan) ?? null;

  return {
    ...state,
    tierName: state.isSubscribed ? "Ember Gold" : "Ember Free",
    activePlanDetails,
    subscribe,
    cancelSubscription,
    plans: SUBSCRIPTION_PLANS,
    features: PREMIUM_FEATURES,
  };
}
