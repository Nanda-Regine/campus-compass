-- ============================================================
-- Migration 000029: Assignment messages, stokvel board, group activity
-- Corrected: uses assignment_messages (group_messages already exists
-- with different schema). Stokvel RLS uses group owner check
-- (stokvel_members has no user_id column).
-- ============================================================

-- ── Emergency contacts (safe re-run) ────────────────────────────────────────
create table if not exists public.emergency_contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  phone      text not null,
  relation   text,
  created_at timestamptz not null default now()
);
alter table public.emergency_contacts enable row level security;
drop policy if exists "Users manage own emergency contacts" on public.emergency_contacts;
create policy "Users manage own emergency contacts" on public.emergency_contacts
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts(user_id);

-- ── Assignment discussion board ──────────────────────────────────────────────
create table if not exists public.assignment_messages (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.group_assignments(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null check (char_length(content) <= 2000),
  is_decision   boolean not null default false,
  is_pinned     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table public.assignment_messages enable row level security;

drop policy if exists "Assignment members read messages" on public.assignment_messages;
create policy "Assignment members read messages" on public.assignment_messages
  for select using (
    exists (
      select 1 from public.group_members gm
      where gm.assignment_id = assignment_messages.assignment_id
        and gm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.group_assignments ga
      where ga.id = assignment_messages.assignment_id
        and ga.created_by = auth.uid()
    )
  );

drop policy if exists "Assignment members post messages" on public.assignment_messages;
create policy "Assignment members post messages" on public.assignment_messages
  for insert with check (
    auth.uid() = user_id
    and (
      exists (
        select 1 from public.group_members gm
        where gm.assignment_id = assignment_messages.assignment_id
          and gm.user_id = auth.uid()
      )
      or exists (
        select 1 from public.group_assignments ga
        where ga.id = assignment_messages.assignment_id
          and ga.created_by = auth.uid()
      )
    )
  );

drop policy if exists "Authors delete own assignment messages" on public.assignment_messages;
create policy "Authors delete own assignment messages" on public.assignment_messages
  for delete using (auth.uid() = user_id);

create index if not exists assignment_messages_assignment_idx
  on public.assignment_messages(assignment_id, created_at asc);

-- ── Group member activity columns (slacking detection) ───────────────────────
alter table public.group_members
  add column if not exists last_active_at   timestamptz,
  add column if not exists tasks_completed  int not null default 0,
  add column if not exists flagged_inactive boolean not null default false;

-- ── Stokvel notice board ─────────────────────────────────────────────────────
-- stokvel_members tracks members by name/phone only (no auth user_id),
-- so RLS grants access to the stokvel group owner only.
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

drop policy if exists "Stokvel owner manages board" on public.stokvel_messages;
create policy "Stokvel owner manages board" on public.stokvel_messages
  using (
    exists (
      select 1 from public.stokvel_groups sg
      where sg.id = stokvel_messages.group_id
        and sg.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.stokvel_groups sg
      where sg.id = stokvel_messages.group_id
        and sg.user_id = auth.uid()
    )
  );

create index if not exists stokvel_messages_group_idx
  on public.stokvel_messages(group_id, created_at asc);
