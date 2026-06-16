-- Alumni Bridge — the Ubuntu loop: graduating students pledge to give back and
-- leave a short letter of encouragement that incoming first-years can read.
-- One row per user. Letters marked public are readable by any signed-in student.

create table if not exists public.alumni_bridge (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  pledges       jsonb not null default '[]'::jsonb,  -- ['mentor','wisdom','refer','donate','stay']
  letter        text,                                -- letter to a first-year
  display_name  text,                                -- how they appear (null = "An alum")
  course        text,                                -- what they studied
  grad_year     integer,
  is_public     boolean not null default true,       -- show letter to first-years
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id)
);

create index if not exists alumni_bridge_public_idx
  on public.alumni_bridge (is_public, created_at desc);

alter table public.alumni_bridge enable row level security;

-- Read: public letters, or always your own row
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_bridge' and policyname='alumni_bridge_read') then
    execute 'create policy "alumni_bridge_read" on public.alumni_bridge
      for select using (is_public = true or auth.uid() = user_id)';
  end if;
end $$;

-- Write: only your own row
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_bridge' and policyname='alumni_bridge_insert') then
    execute 'create policy "alumni_bridge_insert" on public.alumni_bridge
      for insert with check (auth.uid() = user_id)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_bridge' and policyname='alumni_bridge_update') then
    execute 'create policy "alumni_bridge_update" on public.alumni_bridge
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_bridge' and policyname='alumni_bridge_delete') then
    execute 'create policy "alumni_bridge_delete" on public.alumni_bridge
      for delete using (auth.uid() = user_id)';
  end if;
end $$;
