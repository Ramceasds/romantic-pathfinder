import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Sparkles,
  Check,
  Infinity as InfinityIcon,
  Eye,
  RotateCcw,
  Globe,
  Zap,
  Star,
  ShieldCheck,
} from "lucide-react";
import {
  useSubscription,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "@/hooks/use-subscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: SubscriptionPlan;
}

export function SubscriptionModal({
  open,
  onOpenChange,
  defaultPlan = "monthly",
}: SubscriptionModalProps) {
  const { isSubscribed, plan: currentPlan, subscribe, cancelSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(defaultPlan);
  const [loading, setLoading] = useState(false);

  function handleSubscribe() {
    setLoading(true);
    setTimeout(() => {
      subscribe(selectedPlan);
      setLoading(false);
      toast.success(
        `Welcome to Ember Gold! Your ${selectedPlan} membership is now active.`
      );
      onOpenChange(false);
    }, 600);
  }

  function handleCancel() {
    cancelSubscription();
    toast.info("Subscription cancelled. You are now on the Free tier.");
    onOpenChange(false);
  }

  const selectedPlanDetails = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-md rounded-[2.5rem] border border-amber-300/40 bg-background/95 p-6 backdrop-blur-2xl shadow-2xl">
        <DialogHeader className="text-center pt-2">
          {/* Gold Crown Badge with Radiant Glow */}
          <div className="relative mx-auto mb-2 flex items-center justify-center">
            <div className="absolute h-20 w-20 rounded-full bg-gradient-to-tr from-amber-400/40 via-yellow-300/30 to-rose-400/30 blur-xl animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 text-white shadow-glow border border-amber-200/50">
              <Crown className="h-9 w-9 fill-white/20 stroke-[2.2] animate-bounce" />
            </div>
          </div>

          <DialogTitle className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 bg-clip-text text-transparent">
            Ember Gold
          </DialogTitle>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto pt-1 leading-relaxed">
            Boost your match rate by up to 4x and unlock unlimited dating superpowers.
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* Plan Selector Cards: Weekly, Monthly, Yearly */}
          <div className="grid grid-cols-3 gap-2.5">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = isSubscribed && currentPlan === plan.id;

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-between rounded-2xl p-3 pt-5 border-2 transition-all duration-200 text-center",
                    isSelected
                      ? "border-amber-500 bg-gradient-to-b from-amber-500/10 to-amber-500/5 shadow-md scale-[1.02]"
                      : "border-border/60 bg-card/60 hover:border-amber-400/40 hover:bg-card",
                  )}
                >
                  {/* Top Discount / Popular Badges */}
                  {plan.savings && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
                      {plan.savings}
                    </span>
                  )}
                  {plan.popular && !plan.savings && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
                      POPULAR
                    </span>
                  )}

                  <span className="text-xs font-bold text-foreground">
                    {plan.name}
                  </span>

                  <div className="my-2">
                    <span className="font-display text-lg font-extrabold text-foreground">
                      {plan.price}
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>

                  <span className="text-[10px] font-semibold text-primary/90">
                    {plan.perWeekEquivalent}/wk
                  </span>

                  {isCurrent && (
                    <span className="mt-1 text-[9px] font-bold text-emerald-600 uppercase">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Premium Perks Checklist */}
          <div className="rounded-2xl border border-border/50 bg-card/75 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> What's Included:
            </span>

            <div className="grid grid-cols-2 gap-2.5 text-left pt-1">
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <InfinityIcon className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">Unlimited Likes</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <Eye className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">See Who Liked You</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <RotateCcw className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">Unlimited Rewinds</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <Star className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">5 Super Likes / Wk</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <Globe className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">Passport Anywhere</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <Zap className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span className="text-xs font-medium text-foreground">Monthly Boost</span>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
            <div className="flex text-amber-400">
              {"★".repeat(5)}
            </div>
            <span>Rated 4.9/5 by 50,000+ members</span>
          </div>

          {/* Action CTA */}
          <div className="space-y-2 pt-1">
            <Button
              size="lg"
              disabled={loading}
              onClick={handleSubscribe}
              className="h-14 w-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-base font-bold text-white shadow-glow-strong hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Crown className="mr-2 h-5 w-5 fill-white/20" />
              {loading
                ? "Processing…"
                : isSubscribed && currentPlan === selectedPlan
                ? "Extend Ember Gold"
                : `Get ${selectedPlanDetails.name} for ${selectedPlanDetails.price}`}
            </Button>

            {isSubscribed && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="w-full text-xs text-muted-foreground hover:text-destructive"
              >
                Cancel active subscription
              </Button>
            )}

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>Cancel anytime in your settings. Secure SSL checkout.</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
