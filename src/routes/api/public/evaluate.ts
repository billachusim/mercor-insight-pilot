import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BodySchema = z.object({
  prompt: z.string().min(1).max(20000),
  response: z.string().min(1).max(40000),
  model_name: z.string().max(120).optional(),
  category: z.string().max(80).optional(),
});

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}

export const Route = createFileRoute("/api/public/evaluate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization") ?? "";
          const token = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice(7).trim()
            : "";
          if (!token) return json({ error: "Missing Bearer token" }, 401);

          const key_hash = await sha256Hex(token);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: keyRow, error: keyErr } = await supabaseAdmin
            .from("api_keys")
            .select("id, user_id, revoked_at")
            .eq("key_hash", key_hash)
            .maybeSingle();

          if (keyErr) return json({ error: "Lookup failed" }, 500);
          if (!keyRow || keyRow.revoked_at)
            return json({ error: "Invalid or revoked API key" }, 401);

          const raw = await request.json().catch(() => null);
          const parsed = BodySchema.safeParse(raw);
          if (!parsed.success)
            return json({ error: "Invalid body", details: parsed.error.flatten() }, 400);

          const { scoreResponse } = await import("@/lib/evaluator.server");
          const scored = await scoreResponse(parsed.data);

          const { data: row, error: insertErr } = await supabaseAdmin
            .from("evaluations")
            .insert({
              user_id: keyRow.user_id,
              prompt: parsed.data.prompt,
              response: parsed.data.response,
              model_name: parsed.data.model_name ?? null,
              category: parsed.data.category ?? null,
              accuracy: scored.accuracy,
              relevance: scored.relevance,
              clarity: scored.clarity,
              completeness: scored.completeness,
              safety: scored.safety,
              overall_score: scored.overall_score,
              feedback: scored.feedback,
              strengths: scored.strengths,
              weaknesses: scored.weaknesses,
              source: "api",
            })
            .select()
            .single();

          if (insertErr) return json({ error: insertErr.message }, 500);

          await supabaseAdmin
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", keyRow.id);

          return json({ evaluation: row });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return json({ error: message }, 500);
        }
      },
    },
  },
});
