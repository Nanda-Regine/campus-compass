-- ============================================================
-- Migration 000028: Discussion boards for groups & stokvel, emergency contacts
-- ============================================================

-- ── Emergency contacts (Supabase-persisted, not just localStorage) ──────────
create table if not exists public.emergency_contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  phone       text not null,
  relation    text,
  created_at  timestamptz not null default now()
);
alter table public.emergency_contacts enable row level security;
create policy "Users manage own emergency contacts" on public.emergency_contacts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts(user_id);

-- ── Group assignment discussion board ────────────────────────────────────────
create table if not exists public.group_messages (
  id              uuid primary key default gen_random_uuid(),
  assignment_id   uuid not null references public.group_assignments(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  content         text not null check (char_length(content) <= 2000),
  is_decision     boolean not null default false,
  is_pinned       boolean not null default false,
  created_at      timestamptz not null default now()
);
alter table public.group_messages enable row level security;
-- Members of the assignment can read and write messages
create policy "Group members can read messages" on public.group_messages
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.assignment_id = group_messages.assignment_id
        and gm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.group_assignments ga
      where ga.id = group_messages.assignment_id
        and ga.created_by = auth.uid()
    )
  );
create policy "Group members can post messages" on public.group_messages
  for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.group_members gm
        where gm.assignment_id = group_messages.assignment_id
          and gm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.group_assignments ga
        where ga.id = group_messages.assignment_id
          and ga.created_by = auth.uid()
      )
    )
  );
create policy "Authors can delete own messages" on public.group_messages
  for delete using (auth.uid() = user_id);
create index if not exists group_messages_assignment_id_idx on public.group_messages(assignment_id, created_at desc);

-- ── Group member activity tracking (for slacking detection) ─────────────────
-- Add last_active_at to group_members if not present
alter table public.group_members
  add column if not exists last_active_at timestamptz,
  add column if not exists tasks_completed int not null default 0,
  add column if not exists flagged_inactive boolean not null default false;

-- ── Stokvel discussion board (group notice board) ────────────────────────────
create table if not exists public.stokvel_messages (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.stokvel_groups(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null check (char_length(content) <= 2000),
  is_decision boolean not null default false,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.stokvel_messages enable row level security;
create policy "Stokvel members can read messages" on public.stokvel_messages
  for select using (
    exists (
      select 1 from public.stokvel_members sm
      where sm.group_id = stokvel_messages.group_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
    )
  );
create policy "Stokvel members can post messages" on public.stokvel_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.stokvel_members sm
      where sm.group_id = stokvel_messages.group_id
        and sm.user_id = auth.uid()
        and sm.is_active = true
    )
  );
create policy "Authors can delete own stokvel messages" on public.stokvel_messages
  for delete using (auth.uid() = user_id);
create index if not exists stokvel_messages_group_id_idx on public.stokvel_messages(group_id, created_at desc);

-- ── Safety reports table (named separately from incidents for anonymity) ─────
-- Note: safety_incidents already exists; this alias view/note is for reports
-- The safety_incidents table already handles anonymous reports (reporter_id can be null)
-- No additional table needed.
