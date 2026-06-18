create table if not exists institution_broadcasts (
  id uuid primary key default gen_random_uuid(),
  university text not null default '',
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 10 and 2000),
  priority text not null default 'normal' check (priority in ('normal','important','urgent')),
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table institution_broadcasts enable row level security;
create policy "broadcasts public read" on institution_broadcasts
  for select using (expires_at is null or expires_at > now());
create policy "authenticated can broadcast" on institution_broadcasts
  for insert with check (auth.uid() = sent_by);
create index if not exists idx_broadcasts_uni on institution_broadcasts(university, sent_at desc);
create table if not exists broadcast_reads (
  broadcast_id uuid not null references institution_broadcasts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (broadcast_id, user_id)
);
alter table broadcast_reads enable row level security;
create policy "users see own reads" on broadcast_reads for select using (auth.uid() = user_id);
create policy "users mark read" on broadcast_reads for insert with check (auth.uid() = user_id);
create index if not exists idx_broadcast_reads_user on broadcast_reads(user_id);
