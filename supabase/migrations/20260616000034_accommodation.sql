-- Housing OS — student accommodation details + rent payment log
-- One row per student (their current place). Strictly private (user_id = auth.uid()).

create table if not exists public.accommodation (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  place_type            text not null default 'digs'
                          check (place_type in ('res','digs','private','home','commune')),
  name                  text,                          -- res name / street address
  monthly_rent          numeric(12,2) not null default 0,
  deposit               numeric(12,2),
  landlord_name         text,
  landlord_contact      text,
  lease_start           date,
  lease_end             date,
  is_nsfas_accredited   boolean default false,
  includes_utilities    boolean default false,
  num_housemates        integer not null default 0,    -- people splitting the rent (excl. self = 0 means solo)
  rent_due_day          integer check (rent_due_day between 1 and 31),
  notes                 text,
  rent_payments         jsonb not null default '[]'::jsonb, -- [{id, amount, date, note}]
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  unique (user_id)
);

create index if not exists accommodation_user_idx on public.accommodation (user_id);

alter table public.accommodation enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='accommodation' and policyname='accommodation_own') then
    execute 'create policy "accommodation_own" on public.accommodation
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
