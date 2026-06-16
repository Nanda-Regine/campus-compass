-- Store the student's procrastination type on their profile so Nova can
-- reference it in every response without a separate query.
alter table public.profiles
  add column if not exists procrastination_type text
    check (procrastination_type in ('perfectionist','overwhelmed','avoidant','impulsive','bored'));
