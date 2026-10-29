-- TDZ live database security check — READ ONLY (changes nothing).
-- The live database has drifted from the migration files (tables and functions
-- created outside them), so run this against the real database. Every row
-- returned is something to review; an empty result means the check passed.

-- 1. Tables anyone could read or write because row-level security is off
SELECT 'rls_disabled' AS check, c.relname AS object, NULL::text AS detail
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity

UNION ALL
-- 2. Write policies that let any signed-in or anonymous user change any row
SELECT 'open_write_policy', tablename || ': ' || policyname,
       cmd || ' to ' || array_to_string(roles, ',') || ' using ' || coalesce(qual, '-') || ' check ' || coalesce(with_check, '-')
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  AND NOT (roles @> ARRAY['service_role']::name[] AND cardinality(roles) = 1)
  AND (coalesce(qual, '') = 'true' OR coalesce(with_check, '') = 'true')

UNION ALL
-- 3. Elevated-rights functions any user can call that can change data
SELECT 'callable_definer_function', p.oid::regprocedure::text,
       CASE WHEN has_function_privilege('anon', p.oid, 'execute') THEN 'anon + authenticated' ELSE 'authenticated' END
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef AND p.provolatile = 'v'
  AND p.prorettype <> 'trigger'::regtype
  AND has_function_privilege('authenticated', p.oid, 'execute')
  AND p.proname NOT IN ('has_role', 'increment_smart_link_clicks')   -- reviewed: safe to expose
  AND pg_get_functiondef(p.oid) ~* '\m(insert|update|delete)\M'

UNION ALL
-- 4. Views that bypass row-level security (run as their owner)
SELECT 'view_bypasses_rls', c.relname, NULL
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
  AND NOT coalesce('security_invoker=true' = ANY (c.reloptions), false)
  AND (has_table_privilege('anon', c.oid, 'select') OR has_table_privilege('authenticated', c.oid, 'select'))

UNION ALL
-- 5. Public storage buckets (anyone with the URL can download files)
SELECT 'public_storage_bucket', b.name, NULL
FROM storage.buckets b
WHERE b.public

ORDER BY 1, 2;
