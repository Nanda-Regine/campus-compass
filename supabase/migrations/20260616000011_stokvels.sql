-- Stokvel savings circles — SA informal savings groups where members
-- contribute monthly and one member receives the full pot each round.
-- Note: stokvel_members and stokvel_contributions already existed with
-- different schemas, so new tables use the _circle_ prefix.

create table if not exists public.stokvels (
  id                uuid primary key default gen_random_uuid(),
  created_by        uuid not null references auth.users(id),
  name              text not null,
  description       text,
  contribution_amount numeric(10,2) not null check (contribution_amount > 0),
  frequency         text not null default 'monthly'
    check (frequency in ('weekly','biweekly','monthly')),
  current_round     integer not null default 1,
  status            text not null default 'active'
    check (status in ('active','paused','completed')),
  created_at        timestamptz default now()
);

create table if not exists public.stokvel_circle_members (
  id               uuid primary key default gen_random_uuid(),
  stokvel_id       uuid not null references public.stokvels(id) on delete cascade,
  user_id          uuid references auth.users(id),
  email            text not null,
  display_name     text,
  payout_position  integer not null,
  status           text not null default 'invited'
    check (status in ('invited','joined')),
  invite_token     text unique,
  joined_at        timestamptz,
  created_at       timestamptz default now(),
  unique (stokvel_id, email)
);

create table if not exists public.stokvel_circle_contributions (
  id           uuid primary key default gen_random_uuid(),
  stokvel_id   uuid not null references public.stokvels(id) on delete cascade,
  member_id    uuid not null references public.stokvel_circle_members(id) on delete cascade,
  round_number integer not null,
  amount       numeric(10,2) not null,
  paid_at      timestamptz default now(),
  created_at   timestamptz default now(),
  unique (member_id, round_number)
);

alter table public.stokvels                    enable row level security;
alter table public.stokvel_circle_members      enable row level security;
alter table public.stokvel_circle_contributions enable row level security;

-- Stokvels: creator + joined members can read; only creator can insert/update
do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvels' and policyname='stokvels_read') then
    execute 'create policy "stokvels_read" on public.stokvels
      using (
        auth.uid() = created_by
        or exists (
          select 1 from public.stokvel_circle_members scm
          where scm.stokvel_id = stokvels.id
            and scm.user_id = auth.uid()
            and scm.status = ''joined''
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvels' and policyname='stokvels_write') then
    execute 'create policy "stokvels_write" on public.stokvels
      for insert with check (auth.uid() = created_by)';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvels' and policyname='stokvels_update') then
    execute 'create policy "stokvels_update" on public.stokvels
      for update using (auth.uid() = created_by)';
  end if;
end $$;

-- Circle members: joined members of same stokvel can see each other
do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_members' and policyname='stokvel_circle_members_read') then
    execute 'create policy "stokvel_circle_members_read" on public.stokvel_circle_members
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.stokvels s
          where s.id = stokvel_circle_members.stokvel_id
            and (
              s.created_by = auth.uid()
              or exists (
                select 1 from public.stokvel_circle_members scm2
                where scm2.stokvel_id = s.id and scm2.user_id = auth.uid() and scm2.status = ''joined''
              )
            )
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_members' and policyname='stokvel_circle_members_insert') then
    execute 'create policy "stokvel_circle_members_insert" on public.stokvel_circle_members
      for insert with check (
        exists (select 1 from public.stokvels s where s.id = stokvel_id and s.created_by = auth.uid())
      )';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_members' and policyname='stokvel_circle_members_update') then
    execute 'create policy "stokvel_circle_members_update" on public.stokvel_circle_members
      for update using (
        user_id = auth.uid()
        or exists (select 1 from public.stokvels s where s.id = stokvel_id and s.created_by = auth.uid())
      )';
  end if;
end $$;

-- Contributions: joined members can read/write their own stokvel contributions
do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_contributions' and policyname='stokvel_circle_contributions_read') then
    execute 'create policy "stokvel_circle_contributions_read" on public.stokvel_circle_contributions
      using (
        exists (
          select 1 from public.stokvel_circle_members scm
          where scm.stokvel_id = stokvel_circle_contributions.stokvel_id
            and scm.user_id = auth.uid()
            and scm.status = ''joined''
        )
        or exists (select 1 from public.stokvels s where s.id = stokvel_id and s.created_by = auth.uid())
      )';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_contributions' and policyname='stokvel_circle_contributions_insert') then
    execute 'create policy "stokvel_circle_contributions_insert" on public.stokvel_circle_contributions
      for insert with check (
        exists (
          select 1 from public.stokvel_circle_members scm
          where scm.id = member_id
            and (scm.user_id = auth.uid() or exists (select 1 from public.stokvels s where s.id = scm.stokvel_id and s.created_by = auth.uid()))
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='stokvel_circle_contributions' and policyname='stokvel_circle_contributions_delete') then
    execute 'create policy "stokvel_circle_contributions_delete" on public.stokvel_circle_contributions
      for delete using (
        exists (select 1 from public.stokvels s where s.id = stokvel_id and s.created_by = auth.uid())
      )';
  end if;
end $$;
