import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { generateOpeners } from "@/lib/openers.functions";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "playful", label: "Playful" },
  { value: "sweet", label: "Sweet" },
  { value: "witty", label: "Witty" },
  { value: "curious", label: "Curious" },
] as const;

type Props = {
  matchId: string;
  name: string;
  topicIdeas: string[];
  onPick: (text: string) => void;
  onClose?: () => void;
};

export function OpenerAssistant({ matchId, name, topicIdeas, onPick, onClose }: Props) {
  const run = useServerFn(generateOpeners);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("playful");
  const [loading, setLoading] = useState(false);
  const [openers, setOpeners] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const r = await run({ data: { matchId, topic, tone } });
      setOpeners(r.openers);
      setError(r.error);
    } catch {
      setError("Couldn't come up with ideas right now.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3 rounded-3xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          Icebreaker ideas for {name}
        </p>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close ideas" className="text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && go()}
        maxLength={120}
        placeholder="What do you want to talk about?"
        className="h-11 w-full rounded-full border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {topicIdeas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topicIdeas.slice(0, 5).map((t) => (
            <button key={t} type="button" onClick={() => setTopic(t)} className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-full bg-muted p-1">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={cn("flex-1 rounded-full py-1.5 text-xs font-medium", tone === t.value ? "bg-card shadow-soft" : "text-muted-foreground")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={go}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : openers.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {openers.length ? "Again" : "Write"}
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loading && !openers.length && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}
      {openers.length > 0 && (
        <div className={cn("space-y-2", loading && "opacity-50")}>
          {openers.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onPick(o)}
              className="w-full rounded-2xl border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
            >
              {o}
            </button>
          ))}
          <p className="text-center text-xs text-muted-foreground">Tap one to edit it before sending.</p>
        </div>
      )}
    </div>
  );
}
