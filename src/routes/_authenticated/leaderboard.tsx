import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Mercor Eval" }] }),
  component: Leaderboard,
});

function Leaderboard() {
  const fetchLb = useServerFn(getLeaderboard);
  const { data = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLb(),
    refetchInterval: 15000,
  });

  const rows = (data as any[]).filter((r) => Number(r.total_evaluations) > 0);
  const podium = rows.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluator leaderboard</h1>
        <p className="text-sm text-muted-foreground">Ranked by total evaluations submitted, then by average score.</p>
      </div>

      {podium.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {podium.map((r, i) => (
            <Card key={r.user_id} className={i === 0 ? "border-amber-500/40 bg-amber-500/5" : ""}>
              <CardContent className="pt-6 text-center">
                <Trophy className={`mx-auto h-6 w-6 ${i === 0 ? "text-amber-500" : i === 1 ? "text-zinc-400" : "text-orange-600"}`} />
                <Avatar className="mx-auto mt-3 h-14 w-14">
                  <AvatarImage src={r.avatar_url ?? undefined} />
                  <AvatarFallback>{(r.display_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="mt-3 font-semibold">{r.display_name ?? "Unnamed"}</div>
                <div className="text-xs text-muted-foreground">{r.total_evaluations} evaluations · avg {Number(r.avg_score).toFixed(2)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">All evaluators</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evaluations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Evaluator</th>
                    <th className="py-2 pr-3">Evaluations</th>
                    <th className="py-2 pr-3">Avg score</th>
                    <th className="py-2">Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.user_id} className="border-b last:border-b-0">
                      <td className="py-3 pr-3 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7"><AvatarImage src={r.avatar_url ?? undefined} /><AvatarFallback>{(r.display_name ?? "?").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                          <span>{r.display_name ?? "Unnamed"}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">{r.total_evaluations}</td>
                      <td className="py-3 pr-3">{Number(r.avg_score).toFixed(2)}</td>
                      <td className="py-3 text-muted-foreground">{r.last_activity ? new Date(r.last_activity).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
