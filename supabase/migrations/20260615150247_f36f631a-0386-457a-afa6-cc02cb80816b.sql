
-- Recreate view with security_invoker so it runs as the querying user
DROP VIEW IF EXISTS public.evaluator_stats;
CREATE VIEW public.evaluator_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  p.display_name,
  p.avatar_url,
  COUNT(e.id) AS total_evaluations,
  COALESCE(AVG(e.overall_score), 0)::NUMERIC(4,2) AS avg_score,
  MAX(e.created_at) AS last_activity
FROM public.profiles p
LEFT JOIN public.evaluations e ON e.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url;
GRANT SELECT ON public.evaluator_stats TO authenticated;

-- Lock down SECURITY DEFINER functions: only the database itself (used in policies/triggers) should run them
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
