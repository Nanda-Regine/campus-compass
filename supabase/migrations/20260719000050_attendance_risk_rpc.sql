-- ─────────────────────────────────────────────────────────────────────────────
-- get_attendance_risk() — scalable replacement for the attendanceAlert cron scan
--
-- The Inngest attendance-alert job used to `select * from attendance_records`
-- (every user, all time) and aggregate in JS — millions of rows into one
-- serverless function at scale = OOM / step timeout. This computes the per
-- user+module attendance %, keeps only the worst at-risk module per user, and
-- returns just those rows — entirely in Postgres, using the (user_id, date) and
-- PK indexes. Bounded by p_since (caller passes the current term / last N days).
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_attendance_risk(
  p_since date,
  p_min_sessions int default 3,
  p_threshold int default 80
)
returns table (user_id uuid, module_name text, pct int)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select ar.user_id,
           ar.module_id,
           count(*)                                          as total,
           count(*) filter (where ar.status <> 'absent')     as attended
    from attendance_records ar
    where ar.status <> 'cancelled'
      and ar.date >= p_since
    group by ar.user_id, ar.module_id
    having count(*) >= p_min_sessions
  ),
  scored as (
    select a.user_id,
           coalesce(m.module_name, 'Unknown')                        as module_name,
           round(a.attended::numeric / a.total * 100)::int           as pct
    from agg a
    left join modules m on m.id = a.module_id
    where round(a.attended::numeric / a.total * 100) < p_threshold
  )
  select distinct on (user_id) user_id, module_name, pct
  from scored
  order by user_id, pct asc;
$$;

revoke all on function public.get_attendance_risk(date, int, int) from public, anon, authenticated;
