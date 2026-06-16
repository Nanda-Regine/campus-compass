-- Campus Events — students can post and discover events on their campus
-- (study sessions, career workshops, protests, socials, sport, notices)

create table if not exists public.campus_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  institution     text not null,
  title           text not null,
  description     text,
  event_type      text not null default 'social'
    check (event_type in ('study_session','social','career','workshop','sport','protest','notice','other')),
  venue           text,
  event_date      timestamptz not null,
  duration_minutes integer,
  max_attendees   integer,
  is_anonymous    boolean not null default false,
  is_cancelled    boolean not null default false,
  created_at      timestamptz default now()
);

create table if not exists public.event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.campus_events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'going'
    check (status in ('going','maybe')),
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create index if not exists campus_events_institution_date_idx
  on public.campus_events (institution, event_date)
  where is_cancelled = false;

alter table public.campus_events enable row level security;
alter table public.event_rsvps   enable row level security;

-- Events: anyone (authenticated) can read; own events only for write
do $$ begin
  if not exists (select 1 from pg_policies where tablename='campus_events' and policyname='events_read') then
    execute 'create policy "events_read" on public.campus_events using (true)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='campus_events' and policyname='events_insert') then
    execute 'create policy "events_insert" on public.campus_events for insert with check (auth.uid() = user_id)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='campus_events' and policyname='events_update') then
    execute 'create policy "events_update" on public.campus_events for update using (auth.uid() = user_id)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='campus_events' and policyname='events_delete') then
    execute 'create policy "events_delete" on public.campus_events for delete using (auth.uid() = user_id)';
  end if;
end $$;

-- RSVPs: anyone can read; own RSVPs for write
do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_rsvps' and policyname='rsvps_read') then
    execute 'create policy "rsvps_read" on public.event_rsvps using (true)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_rsvps' and policyname='rsvps_insert') then
    execute 'create policy "rsvps_insert" on public.event_rsvps for insert with check (auth.uid() = user_id)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='event_rsvps' and policyname='rsvps_delete') then
    execute 'create policy "rsvps_delete" on public.event_rsvps for delete using (auth.uid() = user_id)';
  end if;
end $$;
