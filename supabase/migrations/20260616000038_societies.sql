-- Societies & Clubs — discover, create and join campus societies.
-- societies are readable by any signed-in student; members table tracks joins.

create table if not exists public.societies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text not null default 'other'
                 check (category in ('academic','cultural','sport','faith','political','social','entrepreneurship','other')),
  description  text,
  institution  text,
  contact      text,                 -- whatsapp / email / link
  created_by   uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now()
);

create index if not exists societies_institution_idx on public.societies (institution, category);

create table if not exists public.society_members (
  id          uuid primary key default gen_random_uuid(),
  society_id  uuid not null references public.societies(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  joined_at   timestamptz default now(),
  unique (society_id, user_id)
);

create index if not exists society_members_soc_idx on public.society_members (society_id);
create index if not exists society_members_user_idx on public.society_members (user_id);

alter table public.societies enable row level security;
alter table public.society_members enable row level security;

-- societies: any signed-in student can read; creators manage their own
do $$ begin
  if not exists (select 1 from pg_policies where tablename='societies' and policyname='societies_read') then
    execute 'create policy "societies_read" on public.societies for select using (auth.uid() is not null)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='societies' and policyname='societies_insert') then
    execute 'create policy "societies_insert" on public.societies for insert with check (created_by = auth.uid())';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='societies' and policyname='societies_modify') then
    execute 'create policy "societies_modify" on public.societies for all using (created_by = auth.uid()) with check (created_by = auth.uid())';
  end if;
end $$;

-- members: readable by signed-in students (for counts); users manage their own membership
do $$ begin
  if not exists (select 1 from pg_policies where tablename='society_members' and policyname='society_members_read') then
    execute 'create policy "society_members_read" on public.society_members for select using (auth.uid() is not null)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='society_members' and policyname='society_members_join') then
    execute 'create policy "society_members_join" on public.society_members for insert with check (user_id = auth.uid())';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='society_members' and policyname='society_members_leave') then
    execute 'create policy "society_members_leave" on public.society_members for delete using (user_id = auth.uid())';
  end if;
end $$;
