-- Academic Fee Balance & Block Tracker
-- Tracks outstanding university fees, the debt threshold above which a student's
-- results/registration get blocked, and a running log of payments made.
-- One row per (user, academic year). Strictly private (user_id = auth.uid()).

create table if not exists public.academic_fees (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  academic_year       integer not null,
  institution         text,
  total_fees          numeric(12,2) not null default 0,   -- total billed for the year
  amount_paid         numeric(12,2) not null default 0,   -- running total paid
  block_threshold     numeric(12,2),                      -- outstanding debt above which results/reg are blocked
  payment_plan        text,                               -- notes on any arrangement
  next_payment_amount numeric(12,2),
  next_payment_date   date,
  payments            jsonb not null default '[]'::jsonb, -- [{id, amount, date, note}]
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (user_id, academic_year)
);

create index if not exists academic_fees_user_year_idx
  on public.academic_fees (user_id, academic_year desc);

alter table public.academic_fees enable row level security;

-- Strictly private — users can only see and manage their own fee records
do $$ begin
  if not exists (select 1 from pg_policies where tablename='academic_fees' and policyname='academic_fees_own') then
    execute 'create policy "academic_fees_own" on public.academic_fees
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
