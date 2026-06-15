import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { Send, Sparkles, TrendingUp, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Mercor Eval" }] }),
  component: Dashboard,
});

type Evaluation = {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  model_name: string | null;
  category: string | null;
  overall_score: number;
  accuracy: number;
  relevance: number;
  clarity: number;
  completeness: number;
  safety: number;
  feedback: string;
  source: string;
  created_at: string;
};

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [category, setCategory] = useState<string>("all");
  const [model, setModel] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [minScore, setMinScore] = useState<string>("");

  const { data: evals = [], isLoading } = useQuery({
    queryKey: ["evaluations", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Evaluation[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("dashboard-evaluations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "evaluations" },
        () => setRefreshKey((k) => k + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(evals.map((e) => e.category).filter(Boolean))) as string[],
    [evals],
  );
  const models = useMemo(
    () => Array.from(new Set(evals.map((e) => e.model_name).filter(Boolean))) as string[],
    [evals],
  );

  const filtered = evals.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (model !== "all" && e.model_name !== model) return false;
    if (source !== "all" && e.source !== source) return false;
    if (minScore && Number(e.overall_score) < Number(minScore)) return false;
    return true;
  });

  const avgScore = filtered.length
    ? (filtered.reduce((s, e) => s + Number(e.overall_score), 0) / filtered.length).toFixed(2)
    : "—";
  const recentCount = filtered.filter(
    (e) => new Date(e.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000,
  ).length;

  const chartData = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return sorted.slice(-30).map((e) => ({
      time: format(new Date(e.created_at), "MMM d HH:mm"),
      score: Number(e.overall_score),
    }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live AI evaluation activity and scores.</p>
        </div>
        <Link to="/submit">
          <Button>
            <Send className="mr-2 h-4 w-4" /> New evaluation
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Layers className="h-4 w-4" />} label="Total (filtered)" value={String(filtered.length)} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Average score" value={avgScore} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="Last 24h" value={String(recentCount)} />
        <Stat icon={<Sparkles className="h-4 w-4" />} label="From Python API" value={String(filtered.filter((e) => e.source === "api").length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score trend (recent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All models</SelectItem>
              {models.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="api">Python API</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Min overall score"
            type="number"
            min={0}
            max={10}
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations yet. Submit one to get started.</p>
          ) : (
            <ul className="divide-y">
              {filtered.slice(0, 50).map((e) => (
                <li key={e.id}>
                  <Link to="/evaluations/$id" params={{ id: e.id }} className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-md">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ScoreBadge value={Number(e.overall_score)} />
                        {e.category && <Badge variant="secondary">{e.category}</Badge>}
                        {e.model_name && <Badge variant="outline">{e.model_name}</Badge>}
                        <Badge variant={e.source === "api" ? "default" : "outline"} className="text-xs">
                          {e.source}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-foreground">{e.prompt}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "PP p")}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function ScoreBadge({ value }: { value: number }) {
  const color = value >= 8 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : value >= 5 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
    : "bg-rose-500/15 text-rose-700 dark:text-rose-400";
  return (
    <span className={`inline-flex h-6 min-w-10 items-center justify-center rounded-md px-2 text-xs font-semibold ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}
