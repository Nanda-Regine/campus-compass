-- Persist the three FSRS-5 fields that were previously recomputed on every load.
-- stability: memory durability (float, computed by ts-fsrs)
-- lapses:    how many times the card was forgotten (int, resets to 0 was wrong)
-- state:     0=New / 1=Learning / 2=Review / 3=Relearning

alter table public.flashcard_cards
  add column if not exists stability float8  not null default 0,
  add column if not exists lapses    integer not null default 0,
  add column if not exists state     integer not null default 0;
