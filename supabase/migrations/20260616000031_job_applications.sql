-- Job Application Tracker — students track every application in their pipeline
-- Status flow: saved → applied → phone_screen → interview → assessment → offer → accepted / rejected / withdrawn

create table if not exists public.job_applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  job_title     text not null,
  company       text not null,
  job_type      text default 'other',         -- parttime, vacation, grad, learnership, remote, internship, fulltime, other
  status        text not null default 'saved'
    check (status in ('saved','applied','phone_screen','interview','assessment','offer','accepted','rejected','withdrawn')),
  location      text,
  salary_range  text,
  deadline      date,                         -- application deadline
  applied_date  date,                         -- date they actually applied
  interview_at  timestamptz,                  -- scheduled interview datetime
  notes         text,
  url           text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists job_apps_user_status_idx
  on public.job_applications (user_id, status);

alter table public.job_applications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='job_applications' and policyname='job_apps_all') then
    execute 'create policy "job_apps_all" on public.job_applications
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
