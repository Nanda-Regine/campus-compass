-- Migration: flashcard_decks + flashcard_cards
-- SM-2 spaced-repetition flashcards with cloud sync

create table if not exists public.flashcard_decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  module_id   uuid references public.modules(id) on delete set null,
  module_name text not null default '',
  color       text not null default '#4ecf9e',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.flashcard_cards (
  id            uuid primary key default gen_random_uuid(),
  deck_id       uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  front         text not null,
  back          text not null,
  interval_days integer not null default 1,
  ease_factor   numeric(4,2) not null default 2.5,
  repetitions   integer not null default 0,
  next_review   date not null default current_date,
  last_review   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes for common access patterns
create index if not exists flashcard_decks_user_id_idx on public.flashcard_decks(user_id);
create index if not exists flashcard_cards_deck_id_idx on public.flashcard_cards(deck_id);
create index if not exists flashcard_cards_user_id_idx on public.flashcard_cards(user_id);
create index if not exists flashcard_cards_next_review_idx on public.flashcard_cards(user_id, next_review);

-- RLS
alter table public.flashcard_decks enable row level security;
alter table public.flashcard_cards enable row level security;

create policy "Users manage own flashcard decks"
  on public.flashcard_decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own flashcard cards"
  on public.flashcard_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
