-- Bursary Application Tracker — students track bursary/scholarship applications
-- through their lifecycle: researching → drafting → submitted → interview → outcome

create table if not exists public.bursary_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  bursary_name  text not null,
  organization  text,
  amount_rands  integer,                     -- expected or awarded amount
  deadline      date,                        -- application submission deadline
  status        text not null default 'researching'
    check (status in ('researching','drafting','submitted','interview','accepted','rejected','waitlisted')),
  docs_checklist jsonb not null default '[]', -- [{name: string, done: boolean}]
  notes         text,
  result_date   date,                        -- date of acceptance/rejection
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists bursary_apps_user_deadline_idx
  on public.bursary_applications (user_id, deadline);

alter table public.bursary_applications enable row level security;

-- Users manage their own applications only
do $$ begin
  if not exists (select 1 from pg_policies where tablename='bursary_applications' and policyname='bursary_apps_all') then
    execute 'create policy "bursary_apps_all" on public.bursary_applications
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
