
# Mercor AI Feedback Evaluation & Dashboard

A full-stack app where evaluators submit LLM responses (prompt + model output), Lovable AI scores them against a rubric, and a real-time dashboard surfaces scores, trends, and an evaluator leaderboard. A public REST endpoint lets Python clients submit responses via API key.

## Core flows

1. **Auth** — Email/password + Google sign-in. Two roles: `evaluator` (default on signup) and `admin` (granted via DB). Roles stored in a separate `user_roles` table with a `has_role()` security-definer function.
2. **Submit & evaluate** — User pastes a prompt + AI response (and optional model name, category). A server function calls Lovable AI (`google/gemini-3-flash-preview`) with a structured-output rubric and stores: accuracy, relevance, clarity, completeness, safety (0–10 each), an overall score, written feedback, and strengths/weaknesses.
3. **Real-time dashboard** — Supabase Realtime subscription on the `evaluations` table pushes new rows into the UI live. Cards for totals/avg score, a trend chart, and a recent-evaluations feed.
4. **Leaderboard** — Ranks evaluators by submission count and average score, with a top-N podium and a full table.
5. **Filtering** — Filter evaluations by category, model, score range, date range, and evaluator (admin only sees all; evaluators see their own).
6. **Public Python API** — `POST /api/public/evaluate` with `Authorization: Bearer <api_key>` so a Python script can submit a response, get back the scores synchronously, and have results show up in the live dashboard. Each user can mint/revoke API keys from a Settings page.

## Pages

- `/auth` — login/signup (email + Google)
- `/` — landing/marketing for the demo
- `/_authenticated/dashboard` — KPIs, trend chart, live feed, filters
- `/_authenticated/submit` — submit a response for evaluation
- `/_authenticated/evaluations/$id` — full detail view of one evaluation
- `/_authenticated/leaderboard` — evaluator ranking
- `/_authenticated/settings/api-keys` — create/revoke API keys, copy Python snippet
- `/api/public/evaluate` — server route for the Python integration

## Technical details

**Stack:** TanStack Start + Lovable Cloud (Supabase) + Lovable AI Gateway. Tailwind + shadcn for UI, Recharts for charts.

**Schema (migrations):**
- `app_role` enum: `admin`, `evaluator`
- `profiles(id, email, display_name, avatar_url)` — auto-created via trigger on `auth.users` insert
- `user_roles(user_id, role)` + `has_role(_user_id, _role)` security-definer
- `evaluations(id, user_id, prompt, response, model_name, category, overall_score, accuracy, relevance, clarity, completeness, safety, feedback, strengths jsonb, weaknesses jsonb, source text, created_at)` — `source` is `web` or `api`
- `api_keys(id, user_id, name, key_hash, prefix, last_used_at, revoked_at, created_at)` — store SHA-256 hash, never plaintext; show plaintext once on creation
- RLS: evaluators see own rows; admins see all (via `has_role`). Realtime enabled on `evaluations`.
- Grants on every public table per Supabase requirements.

**Server functions (`createServerFn`, in `src/lib/*.functions.ts`):**
- `evaluateResponse({ prompt, response, model_name, category })` — calls Lovable AI with structured output, inserts evaluation, returns row
- `createApiKey({ name })` / `revokeApiKey({ id })` / `listApiKeys()`
- `getLeaderboard()` — aggregates per-evaluator stats

**AI:** Helper `src/lib/ai-gateway.server.ts` wraps `createLovableAiGatewayProvider`. Uses `generateText` with `Output.object` + Zod schema for the rubric. `LOVABLE_API_KEY` auto-provisioned.

**Public Python API:** `src/routes/api/public/evaluate.ts` — POST handler verifies bearer token by hashing and looking up in `api_keys` (not revoked), loads `supabaseAdmin` inside the handler, runs the same evaluator helper, inserts the row with the key's `user_id`, returns JSON. Updates `last_used_at`. CORS-enabled. The Settings page shows a ready-to-copy Python `requests` snippet.

**Realtime:** Subscribe to `postgres_changes` on `evaluations` in the dashboard component, invalidate the relevant React Query keys on insert.

## Out of scope (for this pass)

- Per-user usage quotas / billing
- Editing or re-scoring past evaluations
- Multi-rubric / custom rubric editor
- Email notifications

Once approved, I'll enable Lovable Cloud, run the migration, build server functions + UI, and verify the Python API end-to-end.
