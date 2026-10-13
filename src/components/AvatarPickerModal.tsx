import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProfilePhoto } from "@/components/ProfilePhoto";
import { Upload, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhoto: string | null;
  onSelectPhoto: (path: string) => void;
  onTriggerFileUpload: () => void;
}

const DEMO_LIST = [
  { id: "demo:1", name: "Sophia" },
  { id: "demo:2", name: "Leo" },
  { id: "demo:3", name: "Maya" },
  { id: "demo:4", name: "Liam" },
  { id: "demo:5", name: "Elena" },
  { id: "demo:6", name: "Julian" },
];

export function AvatarPickerModal({
  open,
  onOpenChange,
  currentPhoto,
  onSelectPhoto,
  onTriggerFileUpload,
}: AvatarPickerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[2rem] border border-white/60 bg-background/95 p-6 backdrop-blur-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Avatar Gallery
          </div>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">
            Choose Your Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Custom Upload Option */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onTriggerFileUpload();
            }}
            className="h-12 w-full rounded-2xl border-dashed border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            <Upload className="mr-2 h-4 w-4" /> Upload from device / camera
          </Button>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
              Or pick an instant avatar
            </p>
            <div className="grid grid-cols-3 gap-3">
              {DEMO_LIST.map((item) => {
                const isSelected = currentPhoto === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectPhoto(item.id);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95",
                      isSelected
                        ? "border-primary ring-2 ring-primary/40 shadow-glow"
                        : "border-border/60 hover:border-primary/50",
                    )}
                  >
                    <ProfilePhoto
                      path={item.id}
                      name={item.name}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-md">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
