create table if not exists src_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university text not null default '',
  role text not null check (char_length(role) between 2 and 80),
  portfolio text check (char_length(portfolio) <= 80),
  bio text check (char_length(bio) <= 400),
  is_active boolean not null default true,
  term_start date,
  term_end date,
  created_at timestamptz not null default now(),
  unique(user_id, university)
);
alter table src_members enable row level security;
create policy "src members public read" on src_members for select using (true);
create policy "users manage own src record" on src_members for all using (auth.uid() = user_id);
create index if not exists idx_src_members_uni on src_members(university, is_active);
create table if not exists src_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  university text not null default '',
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 10 and 5000),
  category text not null default 'announcement' check (category in ('announcement','consultation','minutes','event','urgent')),
  pinned boolean not null default false,
  likes_count integer not null default 0,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table src_posts enable row level security;
create policy "src posts public read" on src_posts for select using (true);
create policy "src members can post" on src_posts for insert with check (
  auth.uid() = author_id and
  exists (select 1 from src_members where user_id = auth.uid() and is_active = true)
);
create policy "authors manage own posts" on src_posts for all using (auth.uid() = author_id);
create index if not exists idx_src_posts_uni on src_posts(university, pinned desc, created_at desc);
create table if not exists src_post_likes (
  post_id uuid not null references src_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
alter table src_post_likes enable row level security;
create policy "likes visible" on src_post_likes for select using (true);
create policy "users own likes" on src_post_likes for all using (auth.uid() = user_id);
