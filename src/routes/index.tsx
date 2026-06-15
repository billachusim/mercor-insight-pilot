import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Gauge, Code2, Trophy, Filter, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mercor Eval — AI Feedback Evaluation & Dashboard" },
      {
        name: "description",
        content:
          "Rubric-based AI scoring, live dashboard, evaluator leaderboard, and a Python API for the Mercor engineering demo.",
      },
      { property: "og:title", content: "Mercor Eval — AI Feedback Evaluation" },
      { property: "og:description", content: "Score LLM responses with rubric-based AI feedback in real time." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Mercor Eval</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" /> Engineering demo for Mercor
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          AI feedback evaluation,<br />scored in real time.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Submit any LLM response, get rubric-based scoring across five dimensions, watch the dashboard
          update live, and integrate from Python with a single API key.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg">Start evaluating</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">View dashboard</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Gauge, title: "Rubric scoring", body: "Accuracy, relevance, clarity, completeness, and safety on a 0–10 scale with written feedback." },
          { icon: Zap, title: "Realtime dashboard", body: "New evaluations appear instantly through realtime subscriptions — no page refresh needed." },
          { icon: Trophy, title: "Evaluator leaderboard", body: "Rank evaluators by submission count and average score across the workspace." },
          { icon: Filter, title: "Powerful filtering", body: "Slice by category, model, score range, and date to spot quality regressions fast." },
          { icon: Code2, title: "Python API", body: "POST responses from any Python script with a bearer API key and receive scores synchronously." },
          { icon: Sparkles, title: "Built on Lovable AI", body: "Powered by Gemini through the Lovable AI Gateway — no extra keys to configure." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
