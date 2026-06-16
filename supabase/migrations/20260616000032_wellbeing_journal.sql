-- Wellbeing Journal — private daily journal entries with AI reflection
-- All entries are strictly private (user_id = auth.uid() RLS)

create table if not exists public.wellbeing_journal (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  entry_text    text not null,
  mood_score    integer check (mood_score >= 1 and mood_score <= 5),
  ai_reflection text,           -- Groq-generated 2–3 sentence compassionate reflection
  entry_date    date not null default current_date,
  created_at    timestamptz default now()
);

create index if not exists wellbeing_journal_user_date_idx
  on public.wellbeing_journal (user_id, entry_date desc);

alter table public.wellbeing_journal enable row level security;

-- Strictly private — users can only see and manage their own entries
do $$ begin
  if not exists (select 1 from pg_policies where tablename='wellbeing_journal' and policyname='journal_own') then
    execute 'create policy "journal_own" on public.wellbeing_journal
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
