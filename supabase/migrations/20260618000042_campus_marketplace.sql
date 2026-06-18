create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university text not null default '',
  title text not null check (char_length(title) between 3 and 120),
  description text check (char_length(description) <= 1000),
  price_rands numeric(10,2) check (price_rands is null or price_rands >= 0),
  is_free boolean not null default false,
  category text not null default 'other' check (category in ('textbooks','electronics','clothing','furniture','food','transport','other')),
  condition text check (condition in ('new','like_new','good','fair')),
  pickup_location text check (char_length(pickup_location) <= 200),
  contact_whatsapp text check (char_length(contact_whatsapp) <= 20),
  image_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active','sold','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table marketplace_listings enable row level security;
create policy "active listings visible" on marketplace_listings for select using (status = 'active');
create policy "users manage own listings" on marketplace_listings for all using (auth.uid() = user_id);
create index if not exists idx_marketplace_uni on marketplace_listings(university, status, created_at desc);
create table if not exists marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references marketplace_listings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table marketplace_messages enable row level security;
create policy "users see own messages" on marketplace_messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "users send messages" on marketplace_messages for insert with check (auth.uid() = sender_id and sender_id <> recipient_id);
create policy "recipient marks read" on marketplace_messages for update using (auth.uid() = recipient_id);
create index if not exists idx_marketplace_msgs_listing on marketplace_messages(listing_id, created_at);
create index if not exists idx_marketplace_msgs_recipient on marketplace_messages(recipient_id, read_at);
