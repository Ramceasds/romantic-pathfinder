import { useState } from "react";
import { Ban, Flag, MoreHorizontal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const REASONS = ["Fake profile or scam", "Inappropriate photos", "Harassment or hate", "Spam or selling", "Underage", "Something else"];

type Props = {
  meId: string;
  target: { id: string; display_name: string };
  matchId?: string;
  /** Called after the person is blocked. */
  onBlocked: () => void;
  triggerClassName?: string;
};

export function SafetyMenu({ meId, target, matchId, onBlocked, triggerClassName }: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);

  async function block(silent = false) {
    const { error } = await supabase.from("blocks").insert({ blocker: meId, blocked: target.id });
    if (error && error.code !== "23505") {
      toast.error("Could not block");
      return false;
    }
    if (!silent) toast.success(`${target.display_name} is blocked`, { description: "You won't see or hear from each other." });
    onBlocked();
    return true;
  }

  async function submitReport() {
    if (!reason) return;
    setBusy(true);
    const { error } = await supabase
      .from("reports")
      .insert({ reporter: meId, reported: target.id, reason, details: details.trim(), match_id: matchId ?? null });
    if (error) {
      setBusy(false);
      toast.error("Could not send report");
      return;
    }
    if (alsoBlock) await block(true);
    setBusy(false);
    setReportOpen(false);
    toast.success("Thanks for letting us know", { description: alsoBlock ? `${target.display_name} has also been blocked.` : "We'll review this report." });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Safety options for ${target.display_name}`}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn("flex h-10 w-10 items-center justify-center rounded-full", triggerClassName)}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl">
          <DropdownMenuItem onSelect={() => { setReason(null); setDetails(""); setReportOpen(true); }} className="gap-2 rounded-xl py-2.5">
            <Flag className="h-4 w-4" /> Report {target.display_name}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="gap-2 rounded-xl py-2.5 text-destructive focus:text-destructive">
            <Ban className="h-4 w-4" /> Block {target.display_name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Block {target.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't appear in Discover, your chat will be hidden, and neither of you can send messages. They won't be told.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => block()}>
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-md overflow-y-auto rounded-t-[2rem] px-5 pb-8">
          <SheetHeader className="text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-primary">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <SheetTitle className="font-display text-2xl">Report {target.display_name}</SheetTitle>
            <p className="text-sm text-muted-foreground">Your report is private. What's going on?</p>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                  reason === r ? "border-primary bg-accent text-accent-foreground" : "bg-card",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {reason && (
            <div className="mt-4 space-y-4">
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} rows={3} placeholder="Add details (optional)" className="rounded-2xl" />
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                Also block {target.display_name}
              </label>
              <Button onClick={submitReport} disabled={busy} size="lg" className="h-13 w-full rounded-full bg-gradient-primary shadow-glow">
                {busy ? "Sending…" : "Send report"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
