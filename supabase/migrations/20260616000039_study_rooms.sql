-- Live Study Rooms — drop into a shared focus session with your cohort.
-- A room is "live" while now() < ends_at. Members table tracks who's in.

create table if not exists public.study_rooms (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  topic         text,
  institution   text,
  host_id       uuid not null references auth.users(id) on delete cascade,
  focus_minutes integer not null default 50,
  ends_at       timestamptz not null,
  created_at    timestamptz default now()
);

create index if not exists study_rooms_live_idx on public.study_rooms (institution, ends_at desc);

create table if not exists public.study_room_members (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references public.study_rooms(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text,
  joined_at    timestamptz default now(),
  unique (room_id, user_id)
);

create index if not exists study_room_members_room_idx on public.study_room_members (room_id);

alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_rooms' and policyname='study_rooms_read') then
    execute 'create policy "study_rooms_read" on public.study_rooms for select using (auth.uid() is not null)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_rooms' and policyname='study_rooms_insert') then
    execute 'create policy "study_rooms_insert" on public.study_rooms for insert with check (host_id = auth.uid())';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_rooms' and policyname='study_rooms_modify') then
    execute 'create policy "study_rooms_modify" on public.study_rooms for all using (host_id = auth.uid()) with check (host_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_room_members' and policyname='study_room_members_read') then
    execute 'create policy "study_room_members_read" on public.study_room_members for select using (auth.uid() is not null)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_room_members' and policyname='study_room_members_join') then
    execute 'create policy "study_room_members_join" on public.study_room_members for insert with check (user_id = auth.uid())';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='study_room_members' and policyname='study_room_members_leave') then
    execute 'create policy "study_room_members_leave" on public.study_room_members for delete using (user_id = auth.uid())';
  end if;
end $$;
