import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SwipeCard } from "@/components/SwipeCard";
import type { Profile } from "@/lib/profile";
import { Eye, Sparkles } from "lucide-react";

interface ProfilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewProfile: {
    id?: string | undefined;
    user_id?: string | null | undefined;
    display_name?: string | undefined;
    age?: number | undefined;
    gender?: string | undefined;
    interested_in?: string | undefined;
    city?: string | undefined;
    bio?: string | undefined;
    interests?: string[] | undefined;
    photo_url?: string | null | undefined;
    min_age?: number | undefined;
    max_age?: number | undefined;
  };
}

export function ProfilePreviewDialog({
  open,
  onOpenChange,
  previewProfile,
}: ProfilePreviewDialogProps) {
  // Construct a complete fallback profile object for rendering
  const fullProfile: Profile = {
    id: previewProfile.id ?? "preview",
    user_id: previewProfile.user_id ?? "preview_user",
    display_name: previewProfile.display_name?.trim() || "Your Name",
    age: Number(previewProfile.age) || 24,
    gender: previewProfile.gender ?? "woman",
    interested_in: previewProfile.interested_in ?? "everyone",
    city: previewProfile.city?.trim() || "Your City",
    bio: previewProfile.bio?.trim() || "No bio added yet. Add a fun prompt or tell people what you love!",
    interests: previewProfile.interests && previewProfile.interests.length > 0 ? previewProfile.interests : ["Coffee", "Travel"],
    photo_url: previewProfile.photo_url ?? null,
    is_demo: false,
    min_age: previewProfile.min_age ?? 18,
    max_age: previewProfile.max_age ?? 80,
    created_at: new Date().toISOString(),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[2.5rem] border border-white/60 bg-background/95 p-6 backdrop-blur-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Eye className="h-3.5 w-3.5" /> Discovery Preview
          </div>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            How others see you
          </DialogTitle>
        </DialogHeader>

        {/* Live Card Container */}
        <div className="relative mx-auto my-2 h-[420px] w-full max-w-[280px]">
          <SwipeCard
            profile={fullProfile}
            interactive={false}
            fly={null}
            onDecide={() => {}}
          />
        </div>

        <div className="pt-2 text-center">
          <p className="mb-4 text-xs text-muted-foreground">
            This is your live card shown to potential matches in Discover.
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-gradient-romantic text-sm font-semibold text-white shadow-glow"
          >
            <Sparkles className="mr-2 h-4 w-4" /> Looks good!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
