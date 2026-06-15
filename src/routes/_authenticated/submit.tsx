import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { evaluateResponse } from "@/lib/evaluations.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/submit")({
  head: () => ({ meta: [{ title: "New evaluation — Mercor Eval" }] }),
  component: SubmitPage,
});

function SubmitPage() {
  const navigate = useNavigate();
  const evaluate = useServerFn(evaluateResponse);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState("");

  const mutation = useMutation({
    mutationFn: (input: { prompt: string; response: string; model_name?: string; category?: string }) =>
      evaluate({ data: input }),
    onSuccess: (row: any) => {
      toast.success("Evaluation complete");
      navigate({ to: "/evaluations/$id", params: { id: row.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      prompt,
      response,
      model_name: modelName || undefined,
      category: category || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New evaluation</h1>
        <p className="text-sm text-muted-foreground">Paste a prompt and AI response. Lovable AI scores it on a 5-dimension rubric.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Response to evaluate</CardTitle>
          <CardDescription>Optional: tag the model and category for filtering.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea id="prompt" required rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="The user prompt the AI was responding to…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="response">AI response</Label>
              <Textarea id="response" required rows={8} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="The AI-generated response…" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="model">Model name (optional)</Label>
                <Input id="model" value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="gpt-5, gemini-3-pro, …" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category (optional)</Label>
                <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="coding, summarization, customer support…" />
              </div>
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? "Scoring…" : "Score response"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
