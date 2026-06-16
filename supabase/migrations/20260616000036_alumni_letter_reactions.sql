-- Alumni letter reactions — first-years can thank or reply to an alum's letter.
-- Closes the loop both ways: the alum sees their words landed.

create table if not exists public.alumni_letter_reactions (
  id          uuid primary key default gen_random_uuid(),
  bridge_id   uuid not null references public.alumni_bridge(id) on delete cascade,
  from_user   uuid not null references auth.users(id) on delete cascade,
  kind        text not null check (kind in ('thank','reply')),
  message     text,
  created_at  timestamptz default now()
);

create index if not exists alumni_reactions_bridge_idx
  on public.alumni_letter_reactions (bridge_id, created_at desc);

alter table public.alumni_letter_reactions enable row level security;

-- Insert: only as yourself
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_letter_reactions' and policyname='alumni_reactions_insert') then
    execute 'create policy "alumni_reactions_insert" on public.alumni_letter_reactions
      for insert with check (from_user = auth.uid())';
  end if;
end $$;

-- Read: the sender sees their own; the letter''s author sees reactions to their letter
do $$ begin
  if not exists (select 1 from pg_policies where tablename='alumni_letter_reactions' and policyname='alumni_reactions_read') then
    execute 'create policy "alumni_reactions_read" on public.alumni_letter_reactions
      for select using (
        from_user = auth.uid()
        or exists (select 1 from public.alumni_bridge b where b.id = bridge_id and b.user_id = auth.uid())
      )';
  end if;
end $$;
