import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EvaluateInputSchema = z.object({
  prompt: z.string().min(1).max(20000),
  response: z.string().min(1).max(40000),
  model_name: z.string().max(120).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
});

export const evaluateResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EvaluateInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { scoreResponse } = await import("./evaluator.server");
    const scored = await scoreResponse(data);

    const { data: row, error } = await context.supabase
      .from("evaluations")
      .insert({
        user_id: context.userId,
        prompt: data.prompt,
        response: data.response,
        model_name: data.model_name ?? null,
        category: data.category ?? null,
        accuracy: scored.accuracy,
        relevance: scored.relevance,
        clarity: scored.clarity,
        completeness: scored.completeness,
        safety: scored.safety,
        overall_score: scored.overall_score,
        feedback: scored.feedback,
        strengths: scored.strengths,
        weaknesses: scored.weaknesses,
        source: "web",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEvaluation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("evaluations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
