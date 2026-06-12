-- Sprint 8B Social: Community Notes Marketplace + Study Twin Matching

-- ── Community Notes ───────────────────────────────────────────────────────────
create table if not exists community_notes (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  module_code   text not null,
  description   text,
  institution   text,
  faculty       text,
  year_of_study text,
  link_url      text not null,
  file_type     text default 'link' check (file_type in ('pdf','doc','slides','images','link')),
  tags          text[] default '{}',
  save_count    integer default 0,
  created_at    timestamptz default now()
);

alter table community_notes enable row level security;

create policy "Notes viewable by authenticated users"
  on community_notes for select to authenticated using (true);

create policy "Users insert own notes"
  on community_notes for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete own notes"
  on community_notes for delete to authenticated using (auth.uid() = user_id);

-- ── Note Saves (bookmarks) ────────────────────────────────────────────────────
create table if not exists note_saves (
  id       uuid default gen_random_uuid() primary key,
  user_id  uuid references auth.users(id) on delete cascade not null,
  note_id  uuid references community_notes(id) on delete cascade not null,
  saved_at timestamptz default now(),
  unique(user_id, note_id)
);

alter table note_saves enable row level security;

create policy "Users manage own note saves"
  on note_saves for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Increment save_count when a note is saved
create or replace function increment_note_save_count()
returns trigger language plpgsql as $$
begin
  update community_notes set save_count = save_count + 1 where id = new.note_id;
  return new;
end;
$$;

create trigger on_note_save
  after insert on note_saves
  for each row execute function increment_note_save_count();

create or replace function decrement_note_save_count()
returns trigger language plpgsql as $$
begin
  update community_notes set save_count = greatest(0, save_count - 1) where id = old.note_id;
  return old;
end;
$$;

create trigger on_note_unsave
  after delete on note_saves
  for each row execute function decrement_note_save_count();

-- ── Study Twin Opt-in ─────────────────────────────────────────────────────────
alter table profiles add column if not exists study_twin_opt_in boolean default false;
alter table profiles add column if not exists whatsapp_number text;

-- Index for fast twin matching
create index if not exists idx_profiles_twin_match
  on profiles(university, faculty, study_twin_opt_in)
  where study_twin_opt_in = true;

-- Index for notes browsing
create index if not exists idx_notes_institution on community_notes(institution);
create index if not exists idx_notes_module on community_notes(module_code);
create index if not exists idx_notes_created on community_notes(created_at desc);
