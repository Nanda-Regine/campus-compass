alter table marketplace_listings
  add column if not exists listing_type text not null default 'sale'
    check (listing_type in ('sale', 'lost', 'found'));

create index if not exists idx_marketplace_type
  on marketplace_listings(university, listing_type, status, created_at desc);
