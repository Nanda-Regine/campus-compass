-- ============================================================
-- VarsityOS Migration 004 — Orchestration Layer
-- Tables: signals, student_state_snapshots, intervention_log,
--         daily_plans, attendance_records
-- Run in VarsityOS Supabase SQL editor (NOT via MCP)
-- ============================================================

-- ─── Signal log ───────────────────────────────────────────────
-- Persists every emitted signal for analytics + cooldown replay

create table if not exists signals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  signal_type  text not null,
  payload      jsonb not null default '{}',
  emitted_at   timestamptz not null default now()
);

create index signals_user_id_idx       on signals(user_id);
create index signals_type_user_idx     on signals(signal_type, user_id);
create index signals_emitted_at_idx    on signals(emitted_at desc);

alter table signals enable row level security;
create policy "signals: own rows only"
  on signals for all using (auth.uid() = user_id);

-- ─── Student state snapshots ──────────────────────────────────
-- Daily snapshot of computed StudentState for trend analysis

create table if not exists student_state_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  snapshot_date       date not null default current_date,
  academic_risk       text not null default 'safe',
  completion_rate     int  not null default 100,
  exam_pressure       int  not null default 0,
  catchup_debt_hrs    int  not null default 0,
  financial_runway    int  not null default 30,
  financial_health    int  not null default 75,
  burnout_score       int  not null default 0,
  procrastination_idx int  not null default 0,
  data_completeness   int  not null default 0,
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

create index state_snapshots_user_date_idx on student_state_snapshots(user_id, snapshot_date desc);

alter table student_state_snapshots enable row level security;
create policy "snapshots: own rows only"
  on student_state_snapshots for all using (auth.uid() = user_id);

-- ─── Intervention log ─────────────────────────────────────────
-- Audit trail of every intervention shown and its outcome

create type intervention_outcome as enum ('acted', 'dismissed', 'snoozed', 'expired');

create table if not exists intervention_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  rule_id      text not null,
  urgency      int  not null check (urgency between 1 and 5),
  variant      text not null,
  title        text not null,
  outcome      intervention_outcome,
  action_route text,
  shown_at     timestamptz not null default now(),
  resolved_at  timestamptz
);

create index intervention_log_user_idx on intervention_log(user_id, shown_at desc);
create index intervention_log_rule_idx on intervention_log(rule_id, user_id);

alter table intervention_log enable row level security;
create policy "intervention_log: own rows only"
  on intervention_log for all using (auth.uid() = user_id);

-- ─── Daily plans ──────────────────────────────────────────────
-- Stores Nova-generated day plans and catch-up plans

create type plan_mode as enum ('day', 'catchup', 'week');

create table if not exists daily_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  plan_date     date not null default current_date,
  mode          plan_mode not null default 'day',
  content       text not null,
  context       jsonb,
  completed_pct int  not null default 0,
  created_at    timestamptz not null default now()
);

create index daily_plans_user_date_idx on daily_plans(user_id, plan_date desc);

alter table daily_plans enable row level security;
create policy "daily_plans: own rows only"
  on daily_plans for all using (auth.uid() = user_id);

-- ─── Attendance records ───────────────────────────────────────
-- Per-module attendance tracking for the attendance_risk rule

create table if not exists attendance_records (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  module_id    uuid references modules(id) on delete cascade,
  class_date   date not null,
  attended     boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now(),
  unique(user_id, module_id, class_date)
);

create index attendance_user_module_idx on attendance_records(user_id, module_id);
create index attendance_user_date_idx   on attendance_records(user_id, class_date desc);

alter table attendance_records enable row level security;
create policy "attendance: own rows only"
  on attendance_records for all using (auth.uid() = user_id);

-- ─── Attendance summary view ──────────────────────────────────
-- Used by attendance_risk rule: percentage per module

create or replace view attendance_summary as
select
  user_id,
  module_id,
  count(*)                                         as total_classes,
  count(*) filter (where attended = true)          as attended_count,
  round(
    count(*) filter (where attended = true)::numeric
    / nullif(count(*), 0) * 100
  )::int                                           as attendance_pct
from attendance_records
group by user_id, module_id;
