-- ── Study Battles — 1v1 XP race between students ────────────────────────────
create table if not exists study_battles (
  id                   uuid        primary key default gen_random_uuid(),
  challenger_id        uuid        not null references auth.users(id) on delete cascade,
  opponent_id          uuid        references auth.users(id) on delete set null,
  battle_code          text        not null unique,
  duration_hours       int         not null default 24
                                   check (duration_hours in (24, 48, 168)),
  status               text        not null default 'pending'
                                   check (status in ('pending','active','complete','cancelled')),
  start_at             timestamptz,
  end_at               timestamptz,
  challenger_xp_start  int         not null default 0,
  opponent_xp_start    int,
  challenger_xp_end    int,
  opponent_xp_end      int,
  winner_id            uuid        references auth.users(id),
  created_at           timestamptz not null default now()
);

alter table study_battles enable row level security;

-- Challenger and opponent can read their own battles
create policy "battles_select" on study_battles
  for select using (auth.uid() = challenger_id or auth.uid() = opponent_id);

-- Anyone can read a battle by code (for join flow)
create policy "battles_select_by_code" on study_battles
  for select using (status = 'pending');

create policy "battles_insert" on study_battles
  for insert with check (auth.uid() = challenger_id);

create policy "battles_update" on study_battles
  for update using (auth.uid() = challenger_id or auth.uid() = opponent_id);

create index if not exists idx_battles_code        on study_battles (battle_code);
create index if not exists idx_battles_challenger  on study_battles (challenger_id);
create index if not exists idx_battles_opponent    on study_battles (opponent_id);
create index if not exists idx_battles_status      on study_battles (status);

-- ── Community Weekly Bounty — collective goal progress ───────────────────────
create table if not exists community_weekly_bounty (
  week_start   date   not null,
  event_type   text   not null,
  total_count  bigint not null default 0,
  goal         bigint not null default 500,
  primary key (week_start, event_type)
);

alter table community_weekly_bounty enable row level security;
create policy "bounty_read_all"   on community_weekly_bounty for select using (true);
create policy "bounty_insert_auth" on community_weekly_bounty for insert with check (auth.uid() is not null);
create policy "bounty_update_auth" on community_weekly_bounty for update using (auth.uid() is not null);

-- Atomic increment — called via supabase.rpc('increment_community_bounty', ...)
create or replace function increment_community_bounty(
  p_week_start date,
  p_event_type text,
  p_goal       bigint default 500
)
returns void language plpgsql security definer as $$
begin
  insert into community_weekly_bounty (week_start, event_type, total_count, goal)
  values (p_week_start, p_event_type, 1, p_goal)
  on conflict (week_start, event_type)
  do update set total_count = community_weekly_bounty.total_count + 1;
end;
$$;

-- ── Leaderboard view function — privacy-safe ranked list ─────────────────────
create or replace function get_leaderboard(
  p_university text default null,
  p_year       int  default null,
  p_limit      int  default 25
)
returns table(
  user_id        uuid,
  first_name     text,
  university     text,
  year_of_study  int,
  degree         text,
  total_xp       bigint
)
language sql security definer as $$
  select
    x.user_id,
    split_part(coalesce(p.full_name, p.name, 'Student'), ' ', 1) as first_name,
    coalesce(p.university, 'SA University')                       as university,
    p.year_of_study,
    coalesce(p.degree, '')                                        as degree,
    x.total_xp
  from user_xp_state x
  join profiles p on p.id = x.user_id
  where (p_university is null or p.university = p_university)
    and (p_year       is null or p.year_of_study = p_year)
    and x.total_xp > 0
  order by x.total_xp desc
  limit p_limit;
$$;
