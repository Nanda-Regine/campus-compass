-- ============================================================
-- VarsityOS Migration — Alumni Mentor Network
-- Tables: mentor_profiles, mentor_requests
-- ============================================================

create table if not exists mentor_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references profiles(id) on delete cascade,
  display_name    text not null,
  institution     text not null,
  degree          text not null,
  grad_year       integer,
  career_field    text not null,
  company         text,
  job_title       text,
  bio             text check (char_length(bio) <= 500),
  available_for   text[] not null default '{}',
  -- e.g. ['career_chat','cv_review','mock_interview','study_advice','industry_insight']
  linkedin_url    text,
  is_active       boolean not null default true,
  response_rate   integer not null default 100,    -- 0-100 %
  total_mentees   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index mentor_institution_idx  on mentor_profiles(institution, is_active);
create index mentor_career_idx       on mentor_profiles(career_field, is_active);

alter table mentor_profiles enable row level security;
create policy "mentor_profiles: public read"
  on mentor_profiles for select using (true);
create policy "mentor_profiles: own insert"
  on mentor_profiles for insert with check (auth.uid() = user_id);
create policy "mentor_profiles: own update"
  on mentor_profiles for update using (auth.uid() = user_id);

-- Mentorship requests
create type mentor_request_status as enum (
  'pending','accepted','declined','completed','cancelled'
);

create table if not exists mentor_requests (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references mentor_profiles(id) on delete cascade,
  mentee_id   uuid not null references profiles(id) on delete cascade,
  topic       text not null
              check (topic in ('career_chat','cv_review','mock_interview','study_advice','industry_insight','other')),
  message     text check (char_length(message) <= 400),
  status      mentor_request_status not null default 'pending',
  mentor_note text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(mentor_id, mentee_id, topic)
);

create index mentor_requests_mentor_idx on mentor_requests(mentor_id, status);
create index mentor_requests_mentee_idx on mentor_requests(mentee_id, status);

alter table mentor_requests enable row level security;
create policy "mentor_requests: mentee insert"
  on mentor_requests for insert with check (auth.uid() = mentee_id);
create policy "mentor_requests: parties view"
  on mentor_requests for select using (
    auth.uid() = mentee_id or
    auth.uid() = (select user_id from mentor_profiles where id = mentor_id)
  );
create policy "mentor_requests: mentor update"
  on mentor_requests for update using (
    auth.uid() = (select user_id from mentor_profiles where id = mentor_id)
  );

create or replace function set_mentor_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger mentor_profile_updated_at
  before update on mentor_profiles
  for each row execute function set_mentor_updated_at();
create trigger mentor_request_updated_at
  before update on mentor_requests
  for each row execute function set_mentor_updated_at();
