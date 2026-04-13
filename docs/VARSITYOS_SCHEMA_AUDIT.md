# VarsityOS Schema Audit
**Date:** 2026-04-12  
**Schema source:** `full-new-schema.sql` + `MASTER_MIGRATION.sql`  
**Tables audited:** 22

---

## ✅ PASS — All checks green

| Check | Detail |
|---|---|
| RLS enabled on all 22 tables | Confirmed in `full-new-schema.sql` lines 427–448 |
| All RLS policies use `auth.uid() = user_id` | Consistent across all policies |
| No publicly readable/writable tables | `app_feedback` uses anonymous INSERT only (intentional) |
| Cascade deletes wired | `profiles.id → auth.users(id) ON DELETE CASCADE`; all user tables `→ profiles(id) ON DELETE CASCADE` |
| No generated columns | Triggers handle computed fields (`month_year`, `current_amount`, `is_completed`) |
| `updated_at` triggers | 8 tables with `updated_at` column all have `touch_updated_at()` trigger |
| 14+ strategic indexes | 14 in clean schema + 15 additional in MASTER_MIGRATION (29 total) |
| POPIA reg number 2026-005658 | Present in `privacy/page.tsx` ×3 (banner, s1, s15) |
| POPIA section in privacy policy | Sections 1–8 cover all POPIA s11 requirements |

---

## ❌ FIXED — Issues resolved in this audit

### 1. `popia_consent` column missing from profiles
**Status:** Fixed in MASTER_MIGRATION section 20  
**SQL added:**
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS popia_consent    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popia_consent_at TIMESTAMPTZ;
```

### 2. POPIA consent not explicit in sign-up flow
**Status:** Fixed in `SignupForm.tsx`  
- Added required checkbox with Zod `z.literal(true)` validation
- Checkbox text includes registration number 2026-005658
- Terms/Privacy links now point to `/terms` and `/privacy` (were `href="#"`)
- `useAuth.ts` `signUp()` now persists `popia_consent: true` + timestamp to profiles on successful registration

### 3. `dashboard_summary` view missing
**Status:** Created in MASTER_MIGRATION section 21  
**View returns per-user:**
- `tier`, `nova_messages_used`, `nova_messages_limit`, `streak_count`
- `income_this_month`, `expenses_this_month` (current calendar month)
- `open_tasks`, `done_tasks`, `overdue_tasks`
- `upcoming_exams` (next 30 days)
- `study_hours_this_week`
- `total_savings` (active goals)
- `unread_notifications`
- Uses `SECURITY INVOKER` — RLS on base tables is honoured automatically

### 4. `full_name` bug in `upgrade/page.tsx`
**Status:** Fixed  
- `.select('name, ...)` → `.select('full_name, ...')` (column is `full_name` in schema)
- `profile?.name` → `profile?.full_name` in PayFast form builder call

### 5. Terms/Privacy href="#" in signup
**Status:** Fixed alongside item 2 above

---

## ⚠️ NOTED — By-design deviations (not bugs)

| Table | Pattern | Reason |
|---|---|---|
| `profiles` | `id` = auth.users PK directly (no separate `user_id`) | Standard Supabase pattern — policies use `auth.uid() = id` |
| `groups` | Ownership via `created_by`, not `user_id` | Shared resource; members join via `group_members` |
| `group_tasks` | `created_by` + `assigned_to` (nullable) | Tasks survive user deletion (`ON DELETE SET NULL`) |
| `group_messages` | `user_id ON DELETE SET NULL` | Message history preserved when user leaves/deletes |
| `app_feedback` | `user_id` nullable, anonymous INSERT allowed | Allows unauthenticated feedback |

---

## 📋 Profiles table — confirmed columns

| Column | Type | Default | ✅/❌ |
|---|---|---|---|
| `id` | UUID PK → auth.users | — | ✅ |
| `full_name` | TEXT | — | ✅ |
| `university` | TEXT | — | ✅ |
| `year_of_study` | INTEGER (1–7) | — | ✅ |
| `plan` | TEXT | `'free'` | ✅ |
| `subscription_tier` | TEXT | `'free'` | ✅ (MASTER_MIGRATION s1) |
| `nova_messages_used` | INTEGER | `0` | ✅ |
| `nova_messages_limit` | INTEGER | `15` | ✅ |
| `nova_messages_reset_at` | TIMESTAMPTZ | NULL | ✅ (MASTER_MIGRATION s1) |
| `onboarding_complete` | BOOLEAN | `false` | ✅ |
| `popia_consent` | BOOLEAN | `false` | ✅ (MASTER_MIGRATION s20) |
| `popia_consent_at` | TIMESTAMPTZ | NULL | ✅ (MASTER_MIGRATION s20) |
| `referral_code` | TEXT UNIQUE | random 8-char | ✅ (MASTER_MIGRATION s1) |
| `referral_credits` | INTEGER | `0` | ✅ (MASTER_MIGRATION s1) |
| `ai_language` | TEXT | NULL | ✅ (MASTER_MIGRATION s1) |
| `streak_count` | INTEGER | `0` | ✅ |

---

## 📋 Index inventory (29 total)

**From `full-new-schema.sql` (14):**
`idx_income_user_month`, `idx_expenses_user_month`, `idx_tasks_user_due`, `idx_tasks_user_status`, `idx_exams_user_date`, `idx_study_user`, `idx_gm_user`, `idx_gm_group`, `idx_gt_group`, `idx_sc_goal`, `idx_nova_user`, `idx_notif_unread`, `idx_shifts_user_date`, `idx_feedback_created`

**From `MASTER_MIGRATION.sql` (15):**
`idx_profiles_subscription_tier`, `idx_profiles_popia`, `idx_payment_logs_user`, `idx_nova_insights_user`, `idx_push_subs_user`, `idx_jobs_student`, `idx_shifts_student`, `idx_assignments_creator`, `idx_gm_assignment`, `idx_gt_assignment`, `idx_savings_goals_user`, `idx_savings_contrib_goal`, `idx_mood_checkins_user`, `idx_referrals_referrer`, `idx_feedback_user`, `idx_feedback_rating`

---

## 🗄️ Action required — Run in Supabase SQL Editor

Sections 20 and 21 were added to `MASTER_MIGRATION.sql` after the initial run.  
**Copy and run sections 20–21 only** (from the `-- 20. POPIA CONSENT` comment to the end of section 21).
