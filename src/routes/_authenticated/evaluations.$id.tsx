import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/evaluations/$id")({
  head: () => ({ meta: [{ title: "Evaluation — Mercor Eval" }] }),
  component: Detail,
  errorComponent: ({ error }) => <div className="p-4 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-4 text-sm">Evaluation not found.</div>,
});

function Detail() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["evaluation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("evaluations").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;
  if (!data) return null;

  const dims = [
    ["Accuracy", data.accuracy],
    ["Relevance", data.relevance],
    ["Clarity", data.clarity],
    ["Completeness", data.completeness],
    ["Safety", data.safety],
  ] as const;

  return (
    <div className="space-y-6">
      <Link to="/dashboard">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
        </Button>
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Evaluation</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(data.created_at), "PPpp")}</p>
        </div>
        <div className="flex items-center gap-2">
          {data.category && <Badge variant="secondary">{data.category}</Badge>}
          {data.model_name && <Badge variant="outline">{data.model_name}</Badge>}
          <Badge variant={data.source === "api" ? "default" : "outline"}>{data.source}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Overall score</CardTitle></CardHeader>
        <CardContent>
          <div className="text-5xl font-semibold tracking-tight">{Number(data.overall_score).toFixed(1)}<span className="text-xl text-muted-foreground">/10</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {dims.map(([label, val]) => (
              <div key={label} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-lg font-semibold">{Number(val).toFixed(1)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Feedback</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed">{data.feedback}</p></CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {(data.strengths ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
              {(!data.strengths || data.strengths.length === 0) && <li className="list-none text-muted-foreground">—</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Weaknesses</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {(data.weaknesses ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
              {(!data.weaknesses || data.weaknesses.length === 0) && <li className="list-none text-muted-foreground">—</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Prompt</CardTitle></CardHeader>
        <CardContent><pre className="whitespace-pre-wrap text-sm">{data.prompt}</pre></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Response</CardTitle></CardHeader>
        <CardContent><pre className="whitespace-pre-wrap text-sm">{data.response}</pre></CardContent>
      </Card>
    </div>
  );
}
