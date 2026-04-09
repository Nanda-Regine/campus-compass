-- ═══════════════════════════════════════════════════════════
-- VarsityOS Schema Audit
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. TABLES + ROW COUNTS
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size('public.' || tablename)) AS total_size,
  (SELECT reltuples::bigint FROM pg_class WHERE relname = tablename) AS approx_rows
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────

-- 2. FOREIGN KEY RELATIONSHIPS
SELECT
  tc.table_name        AS child_table,
  kcu.column_name      AS child_column,
  ccu.table_name       AS parent_table,
  ccu.column_name      AS parent_column,
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

-- ─────────────────────────────────────────────────────────────

-- 3. RLS AUDIT — tables WITHOUT RLS (security risk!)
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = FALSE
ORDER BY tablename;

-- ─────────────────────────────────────────────────────────────

-- 4. MISSING INDEXES ON FK COLUMNS (slow JOINs)
SELECT
  t.relname  AS table_name,
  a.attname  AS column_name
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
ORDER BY table_name, column_name;

-- ─────────────────────────────────────────────────────────────

-- 5. REFERRAL SYSTEM — see if credits reset monthly or are lifetime
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name ILIKE '%referral%';

-- ─────────────────────────────────────────────────────────────

-- 6. PROFILES TABLE — subscription + referral columns
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ─────────────────────────────────────────────────────────────

-- 7. NOVA USAGE TABLE STRUCTURE (check for monthly reset logic)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'nova_usage'
ORDER BY ordinal_position;

-- ─────────────────────────────────────────────────────────────

-- 8. ALL FUNCTIONS (look for reset/cron logic)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ─────────────────────────────────────────────────────────────

-- 9. ORPHAN CHECK — referrals pointing to deleted users
SELECT r.*
FROM referrals r
LEFT JOIN profiles p ON p.id = r.referrer_id
WHERE p.id IS NULL
LIMIT 20;

-- ─────────────────────────────────────────────────────────────

-- 10. SUBSCRIPTION TIER DISTRIBUTION
SELECT
  COALESCE(subscription_tier, 'null') AS subscription_tier,
  is_premium,
  COUNT(*) AS user_count
FROM profiles
GROUP BY subscription_tier, is_premium
ORDER BY user_count DESC;

-- ─────────────────────────────────────────────────────────────

-- 11. NOVA USAGE — current month message counts per user
SELECT
  nu.user_id,
  nu.message_count,
  nu.month_year,
  p.subscription_tier,
  p.referral_credits
FROM nova_usage nu
JOIN profiles p ON p.id = nu.user_id
ORDER BY nu.message_count DESC
LIMIT 50;

-- ─────────────────────────────────────────────────────────────

-- 12. REFERRAL CREDIT EXPOSURE — how many free messages are being
--     granted via referrals (cost risk check)
SELECT
  COUNT(*) AS users_with_credits,
  SUM(referral_credits) AS total_credits_granted,
  ROUND(SUM(referral_credits) * 0.17, 2) AS estimated_cost_rand
FROM profiles
WHERE referral_credits > 0;
