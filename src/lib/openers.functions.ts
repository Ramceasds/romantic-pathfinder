import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  matchId: z.string().uuid(),
  topic: z.string().trim().max(120),
  tone: z.enum(["playful", "sweet", "witty", "curious"]),
});

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["openers"],
  properties: {
    openers: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
  },
};

export const generateOpeners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: match, error } = await sb.from("matches").select("*").eq("id", data.matchId).single();
    if (error || !match) return { error: "Match not found", openers: [] as string[] };
    const { data: profiles } = await sb.from("profiles").select("*").in("id", [match.profile_a, match.profile_b]);
    const me = profiles?.find((p) => p.user_id === context.userId);
    const other = profiles?.find((p) => p.id !== me?.id);
    if (!me || !other) return { error: "Match not found", openers: [] as string[] };

    const describe = (p: typeof me) =>
      `Name: ${p.display_name}, age ${p.age}, city: ${p.city || "unknown"}. Bio: ${p.bio || "(none)"}. Interests: ${p.interests.join(", ") || "(none)"}.`;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { error: "AI is not configured", openers: [] as string[] };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You write first messages for a dating app. Write exactly 3 distinct opening messages from the sender to their match. Each under 220 characters, natural, respectful, specific to details in both profiles (shared interests especially), ending with an easy question. No pickup lines, no emojis spam (max one), no mention of AI.",
        input: `Sender — ${describe(me)}\nMatch — ${describe(other)}\nTopic the sender wants to talk about: ${data.topic || "anything that fits both profiles"}\nTone: ${data.tone}`,
        text: { format: { type: "json_schema", name: "openers", strict: true, schema } },
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) return { error: "Too many requests right now — try again in a moment.", openers: [] as string[] };
      if (res.status === 402) return { error: "AI credits have run out for this app.", openers: [] as string[] };
      return { error: "Couldn't come up with ideas right now.", openers: [] as string[] };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta;
        } catch {
          /* partial frame */
        }
      }
    }
    try {
      const parsed = JSON.parse(text) as { openers: string[] };
      return { error: null, openers: parsed.openers.slice(0, 3) };
    } catch {
      return { error: "Couldn't come up with ideas right now.", openers: [] as string[] };
    }
  });
