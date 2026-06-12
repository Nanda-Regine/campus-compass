-- ============================================================
-- VarsityOS Migration — Study Groups OS
-- Tables: study_groups, study_group_members, study_sessions
-- ============================================================

create table if not exists study_groups (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references profiles(id) on delete cascade,
  name          text not null,
  subject       text,
  module_code   text,
  university    text,
  description   text check (char_length(description) <= 300),
  is_public     boolean not null default true,
  max_members   integer not null default 8,
  meeting_type  text not null default 'hybrid'
                check (meeting_type in ('online','in_person','hybrid')),
  meeting_link  text,
  venue         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index study_groups_university_idx on study_groups(university, is_public);
create index study_groups_subject_idx    on study_groups(subject);

alter table study_groups enable row level security;
create policy "study_groups: public read"
  on study_groups for select using (true);
create policy "study_groups: creator insert"
  on study_groups for insert with check (auth.uid() = creator_id);
create policy "study_groups: creator update"
  on study_groups for update using (auth.uid() = creator_id);
create policy "study_groups: creator delete"
  on study_groups for delete using (auth.uid() = creator_id);

create table if not exists study_group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references study_groups(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       text not null default 'member'
             check (role in ('admin','member')),
  joined_at  timestamptz not null default now(),
  unique(group_id, user_id)
);

create index study_group_members_user_idx  on study_group_members(user_id);
create index study_group_members_group_idx on study_group_members(group_id);

alter table study_group_members enable row level security;
create policy "study_group_members: member read"
  on study_group_members for select using (true);
create policy "study_group_members: self insert"
  on study_group_members for insert with check (auth.uid() = user_id);
create policy "study_group_members: self delete"
  on study_group_members for delete using (auth.uid() = user_id);

-- Group study sessions (scheduled meets — named to avoid conflict with existing study_sessions table)
create table if not exists group_sessions (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references study_groups(id) on delete cascade,
  organizer   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  session_at  timestamptz not null,
  duration_min integer not null default 90,
  location    text,
  link        text,
  created_at  timestamptz not null default now()
);

create index group_sessions_group_idx on group_sessions(group_id, session_at);

alter table group_sessions enable row level security;
create policy "group_sessions: public read"
  on group_sessions for select using (true);
create policy "group_sessions: organizer insert"
  on group_sessions for insert with check (auth.uid() = organizer);

create or replace function set_study_group_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger study_group_updated_at
  before update on study_groups
  for each row execute function set_study_group_updated_at();
