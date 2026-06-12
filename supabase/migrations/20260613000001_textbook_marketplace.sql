-- ============================================================
-- VarsityOS Migration — Textbook Marketplace
-- Tables: textbook_listings, textbook_interests
-- ============================================================

create table if not exists textbook_listings (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references profiles(id) on delete cascade,
  isbn          text,
  title         text not null,
  author        text,
  edition       text,
  subject       text,
  university    text,
  price_cents   integer not null default 0,       -- 0 = free / swap
  condition     text not null default 'good'
                check (condition in ('new','like_new','good','fair','poor')),
  listing_type  text not null default 'sell'
                check (listing_type in ('sell','swap','free')),
  description   text,
  image_url     text,
  is_sold       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index textbook_university_idx on textbook_listings(university, is_sold);
create index textbook_subject_idx    on textbook_listings(subject);
create index textbook_seller_idx     on textbook_listings(seller_id);

alter table textbook_listings enable row level security;
create policy "textbook_listings: public read"
  on textbook_listings for select using (true);
create policy "textbook_listings: seller insert"
  on textbook_listings for insert with check (auth.uid() = seller_id);
create policy "textbook_listings: seller update"
  on textbook_listings for update using (auth.uid() = seller_id);
create policy "textbook_listings: seller delete"
  on textbook_listings for delete using (auth.uid() = seller_id);

-- Interest / contact requests between buyer and seller
create table if not exists textbook_interests (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references textbook_listings(id) on delete cascade,
  buyer_id    uuid not null references profiles(id) on delete cascade,
  message     text,
  created_at  timestamptz not null default now(),
  unique(listing_id, buyer_id)
);

alter table textbook_interests enable row level security;
create policy "textbook_interests: buyer insert"
  on textbook_interests for insert with check (auth.uid() = buyer_id);
create policy "textbook_interests: seller or buyer view"
  on textbook_interests for select using (
    auth.uid() = buyer_id or
    auth.uid() = (select seller_id from textbook_listings where id = listing_id)
  );

create or replace function set_textbook_listing_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger textbook_listing_updated_at
  before update on textbook_listings
  for each row execute function set_textbook_listing_updated_at();
