-- Persist detailed member roles to DB so all teammates see the same roles
-- (previously these were localStorage-only, invisible to other members)
alter table public.group_members
  add column if not exists member_role text
    check (member_role in ('Leader','Researcher','Writer','Designer','Presenter','Reviewer'));

-- Meeting scheduler linked to group assignments
create table if not exists public.group_meetings (
  id           uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.group_assignments(id) on delete cascade,
  created_by   uuid not null references auth.users(id),
  title        text not null,
  meeting_at   timestamptz not null,
  duration_min integer not null default 60,
  location     text,
  link         text,
  agenda       text,
  created_at   timestamptz default now()
);

alter table public.group_meetings enable row level security;

-- Any joined member of the assignment can read/write meetings
create policy "group_meetings_member_access" on public.group_meetings
  using (
    auth.uid() = created_by
    or exists (
      select 1 from public.group_members gm
      where gm.assignment_id = group_meetings.assignment_id
        and gm.user_id = auth.uid()
        and gm.status = 'joined'
    )
  )
  with check (auth.uid() = created_by);
