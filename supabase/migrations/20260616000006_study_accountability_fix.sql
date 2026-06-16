-- ============================================================
-- Migration 000031: Fix study_accountability table
-- Add missing columns, trigger, RLS policies
-- ============================================================

-- Add missing columns
alter table public.study_accountability
  add column if not exists streak_days   integer      not null default 0,
  add column if not exists updated_at    timestamptz  not null default now(),
  add column if not exists university    text;

-- Trigger to auto-update updated_at on row changes
create or replace function public.touch_updated_at()
  returns trigger language plpgsql as
  'begin new.updated_at = now(); return new; end;';

drop trigger if exists study_accountability_set_updated on public.study_accountability;
create trigger study_accountability_set_updated
  before update on public.study_accountability
  for each row execute function public.touch_updated_at();

-- Enable RLS
alter table public.study_accountability enable row level security;

-- Drop any stale policies first
drop policy if exists "own or open goals"       on public.study_accountability;
drop policy if exists "insert own goal"         on public.study_accountability;
drop policy if exists "update own partnership"  on public.study_accountability;

-- SELECT: own goals OR open (pending, no partner) goals from same university
create policy "own or open goals"
  on public.study_accountability for select
  using (
    requester_id = auth.uid()
    or partner_id = auth.uid()
    or (
      status    = 'pending'
      and partner_id is null
      and requester_id <> auth.uid()
    )
  );

-- INSERT: can only insert as requester
create policy "insert own goal"
  on public.study_accountability for insert
  with check (requester_id = auth.uid());

-- UPDATE: requester or accepted partner can update
create policy "update own partnership"
  on public.study_accountability for update
  using (requester_id = auth.uid() or partner_id = auth.uid())
  with check (requester_id = auth.uid() or partner_id = auth.uid());
