-- Migration: personal calendar events
-- Students can log gym, cooking, errands, church, study sessions, etc.

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  event_date  date not null,
  start_time  time,
  end_time    time,
  category    text not null default 'other',
  color       text not null default '#4ecf9e',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists calendar_events_user_date_idx
  on public.calendar_events(user_id, event_date);

alter table public.calendar_events enable row level security;

create policy "Users manage own calendar events"
  on public.calendar_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
