-- VarsityOS Full Schema Audit
-- Run in Supabase Dashboard > SQL Editor
-- Each query is standalone


-- 1. All tables with row counts and size
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) AS total_size,
  s.n_live_tup AS live_rows,
  s.n_dead_tup AS dead_rows
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.tablename
WHERE t.schemaname = 'public'
ORDER BY s.n_live_tup DESC NULLS LAST;


-- 2. All columns for every table
SELECT
  c.table_name,
  c.ordinal_position AS pos,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.character_maximum_length AS max_len,
  c.column_default,
  c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;


-- 3. All primary keys
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- 4. All foreign keys and cascade rules
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY child_table, child_column;


-- 5. All unique constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  STRING_AGG(kcu.column_name, ' | ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;


-- 6. All check constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;


-- 7. All indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;


-- 8. RLS status for all tables
-- rowsecurity FALSE means no RLS and the table is open to all authenticated users
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;


-- 9. All RLS policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd AS operation,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- 10. FK columns missing indexes (these cause slow JOINs)
-- Empty result means all FK columns are indexed
SELECT
  t.relname AS table_name,
  a.attname AS unindexed_fk_column
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_attribute ia ON ia.attrelid = i.indrelid AND ia.attnum = ANY(i.indkey)
    WHERE i.indrelid = t.oid AND ia.attname = a.attname
  )
ORDER BY table_name, unindexed_fk_column;


-- 11. All database functions
SELECT
  routine_name,
  routine_type,
  data_type AS return_type,
  security_type,
  LEFT(routine_definition, 400) AS definition_preview
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;


-- 12. All triggers
SELECT
  trigger_name,
  event_object_table AS table_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;


-- 13. Profiles table columns
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;


-- 14. Nova usage by month
SELECT
  month_year,
  COUNT(*) AS users,
  SUM(message_count) AS total_messages,
  MAX(message_count) AS highest_single_user,
  ROUND(AVG(message_count), 1) AS avg_messages
FROM nova_usage
GROUP BY month_year
ORDER BY month_year DESC;


-- 15. Subscription tier distribution
SELECT
  COALESCE(subscription_tier, 'free') AS tier,
  is_premium,
  COUNT(*) AS users
FROM profiles
GROUP BY subscription_tier, is_premium
ORDER BY users DESC;


-- 16. Revenue estimate
SELECT
  COALESCE(subscription_tier, 'free') AS tier,
  COUNT(*) AS users,
  CASE
    WHEN subscription_tier = 'premium' THEN COUNT(*) * 79
    WHEN subscription_tier = 'scholar' THEN COUNT(*) * 39
    ELSE 0
  END AS estimated_mrr_rand
FROM profiles
GROUP BY subscription_tier
ORDER BY estimated_mrr_rand DESC;


-- 17. apply_referral function body
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'apply_referral';


-- 18. Referrals table columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'referrals'
ORDER BY ordinal_position;


-- 19. Referral credit cost exposure
SELECT
  COUNT(*) FILTER (WHERE referral_credits > 0) AS users_with_credits,
  SUM(referral_credits) AS total_credits,
  ROUND(SUM(referral_credits) * 0.17, 2) AS cost_exposure_rand
FROM profiles;


-- 20. Study planner tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'modules'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exams'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'timetable'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'study_sessions'
ORDER BY ordinal_position;


-- 21. Budget and expense tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'budgets'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'expenses'
ORDER BY ordinal_position;


-- 22. Expense category breakdown
SELECT category, COUNT(*) AS entries, SUM(amount) AS total_rand
FROM expenses
GROUP BY category
ORDER BY total_rand DESC;


-- 23. Meal prep tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('meal_plans', 'meals', 'grocery_items', 'recipes')
ORDER BY table_name, ordinal_position;


-- 24. Work module tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shifts'
ORDER BY ordinal_position;


-- 25. Nova AI tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('nova_conversations', 'nova_messages', 'nova_insights')
ORDER BY table_name, ordinal_position;


-- 26. Nova insights breakdown
SELECT insight_type, dismissed, COUNT(*) AS total
FROM nova_insights
GROUP BY insight_type, dismissed
ORDER BY total DESC;


-- 27. Push notification token tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('push_subscriptions', 'fcm_tokens', 'push_tokens')
ORDER BY table_name, ordinal_position;


-- 28. Study groups tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('study_groups', 'group_members', 'group_assignments', 'group_tasks')
ORDER BY table_name, ordinal_position;


-- 29. Payment and subscription tables
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payments', 'payment_logs')
ORDER BY table_name, ordinal_position;


-- 30. Orphan checks
-- Profiles with no matching auth user
SELECT p.id, p.email, p.created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;

-- Expenses with no budget
SELECT e.id, e.user_id, e.amount, e.created_at
FROM expenses e
LEFT JOIN budgets b ON b.user_id = e.user_id
WHERE b.id IS NULL
LIMIT 20;

-- Nova usage with no profile
SELECT nu.user_id, nu.message_count
FROM nova_usage nu
LEFT JOIN profiles p ON p.id = nu.user_id
WHERE p.id IS NULL;

-- Referrals pointing to deleted referrers
SELECT r.*
FROM referrals r
LEFT JOIN profiles p ON p.id = r.referrer_id
WHERE p.id IS NULL
LIMIT 20;


-- 31. Enum types
SELECT
  t.typname AS enum_name,
  e.enumlabel AS value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY enum_name, sort_order;


-- 32. Extensions enabled
SELECT extname, extversion
FROM pg_extension
ORDER BY extname;


-- 33. Overall health summary
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') AS total_tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = TRUE) AS tables_with_rls,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = FALSE) AS tables_without_rls,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') AS total_functions,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') AS total_triggers,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS total_indexes,
  (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
  (SELECT COUNT(*) FROM profiles) AS total_profiles;
